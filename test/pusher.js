const crypto = require('crypto');
const Redis = require('ioredis');
const config = require('./config.json');
const { collectMetrics } = require('./collector');

const redis = new Redis(config.redisUrl);

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

    console.log(`[${new Date().toISOString()}] Pushed metrics for ${config.serverId}:`, metrics);
  } catch (err) {
    console.error('Failed to push metrics:', err.message);
  }
}

console.log(`Agent started for ${config.serverLabel} (${config.serverId})`);
setInterval(pushMetrics, config.intervalMs);
pushMetrics(); // immediate first push