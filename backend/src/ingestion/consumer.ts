import {Redis} from 'ioredis';
import crypto from 'crypto';
import { writeMetric } from './writer.js';
import { detectAnomaly } from '../anomaly/zscore.js';
import { emitMetric, emitAlert } from '../sockets/liveMetrics.js';
import pool from '../db/client.js';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const STREAM_KEY = 'metrics:stream';
const GROUP_NAME = 'metrics-consumer-group';
const CONSUMER_NAME = `consumer-${process.pid}`;

interface AgentSecretMap {
  [serverId: string]: string;
}

// In production, load this from PostgreSQL (agents table)
async function getAgentSecret(serverId: string): Promise<string | null> {
  // TODO: replace with DB lookup
  // const secrets: AgentSecretMap = {
  //   'server-01': process.env.AGENT_SECRET_SERVER_01 || '',
  // };
  // return secrets[serverId] || null;
     try {
    const result = await pool.query(
      'SELECT secret_hash FROM servers WHERE id = $1',
      [serverId]
    );
    return result.rows[0]?.secret_hash || null;
  } catch (err) {
    console.error('DB lookup failed:', err);
    return null;
  }
}

function verifySignature(json: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(json).digest('hex');
  // timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function ensureConsumerGroup() {
  try {
    await redis.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '0', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
    // group already exists, fine
  }
}

async function processMessage(id: string, fields: string[]) {
  const data: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];

    if (key === undefined || value === undefined) {
      console.warn(`Malformed message ${id}, skipping`);
      return;
    }
    data[key] = value;
  }

  const { data: json, signature, serverId } = data;

  if (!json || !signature || !serverId) {
    console.warn(`Malformed message ${id}, skipping`);
    return;
  }

  const secret = await getAgentSecret(serverId);
  if (!secret) {
    console.warn(`Unknown serverId ${serverId}, dropping`);
    return;
  }

  if (!verifySignature(json, signature, secret)) {
    console.warn(`Invalid HMAC for ${serverId}, dropping (possible attack)`);
    return;
  }

  const metric = JSON.parse(json);

  // 1. write to TimescaleDB (buffered)
  await writeMetric(metric);

  // 2. emit live to dashboard via Socket.io
  emitMetric({
    serverId: metric.serverId,
    cpu: metric.cpu,
    memory: metric.memory,
    disk: metric.disk,
    timestamp: metric.timestamp,
  });

  // 3. run anomaly detection on each metric
  for (const key of ['cpu', 'memory', 'disk'] as const) {
    const anomaly = await detectAnomaly(metric.serverId, key, metric[key]);
    if (anomaly) {
      // emit alert live to dashboard
      emitAlert({
        serverId: metric.serverId,
        metric: key,
        value: metric[key],
        severity: anomaly.severity,
        message: anomaly.message,
      });
    }
  }

  console.log(`Processed metric for ${serverId}`);
}

async function consumeLoop() {
  await ensureConsumerGroup();
  console.log('Consumer started, listening to stream...');

  while (true) {
    try {
      const response = await redis.xreadgroup(
        'GROUP', GROUP_NAME, CONSUMER_NAME,
        'COUNT', 10,
        'BLOCK', 5000,
        'STREAMS', STREAM_KEY, '>'
      );

      if (!response) continue;

      const [, messages] = response[0] as [string, [string, string[]][]];

      for (const [id, fields] of messages) {
        await processMessage(id, fields);
        await redis.xack(STREAM_KEY, GROUP_NAME, id);
      }
    } catch (err) {
      console.error('Consumer loop error:', err);
      await new Promise((res) => setTimeout(res, 2000)); // backoff before retry
    }
  }
}

export { consumeLoop };