import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

// Simple flag to prevent spamming Telegram every 5 seconds
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 60000; // 1 minute cooldown

export async function sendTelegramAlert(serverName: string, metric: string, value: number) {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) return; // Prevent spam

  const message = `🚨 <b>VORTEX ALERT: ${serverName}</b>\n\n` +
                  `⚠️ <b>Metric Spike:</b> ${metric.toUpperCase()} is at <b>${value.toFixed(1)}%</b>\n` +
                  `⏰ <b>Time:</b> ${new Date().toLocaleTimeString()}\n` +
                  `🔴 Action required immediately.`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
    console.log(`[TELEGRAM] Alert dispatched for ${metric}`);
    lastAlertTime = now;
  } catch (err: any) {
    console.error('[TELEGRAM ERROR]', err.message);
  }
}