const crypto = require('crypto');
const Redis = require('ioredis');
const { collectMetrics } = require('./collector');

const config={
  serverId: process.env.SERVER_ID || 'server-01', 
  serverLabel: process.env.SERVER_LABEL || 'Server',
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
  agentSecret: process.env.AGENT_SECRET || '',
  intervalMs: parseInt(process.env.INTERVAL_MS || '5000'),
  streamKey: 'metrics:stream',
  maxStreamLen: 1000,
}

const redis = new Redis(config.redisUrl);

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

function signPayload(payload, secret) {
  const json = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(json).digest('hex');
  return { json, hmac };
}

async function pushMetrics() {
  try {
    const metrics = collectMetrics(config.serverId);
    const { json, hmac } = signPayload(metrics, config.agentSecret);
    await redis.xadd(
      config.streamKey,
      'MAXLEN', '~', config.maxStreamLen,
      '*',
      'data', json,
      'signature', hmac,
      'serverId', config.serverId
    );
    console.log(`[${new Date().toISOString()}] Pushed:`, metrics);
  } catch (err) {
    console.error('Push failed:', err.message);
  }
}

console.log(`Agent started: ${config.serverLabel} (${config.serverId})`);
setInterval(pushMetrics, config.intervalMs);
pushMetrics();

