import axios from 'axios';

interface AlertPayload {
  serverId: string;
  metric: string;
  value: number;
  severity: 'warning' | 'critical';
  message: string;
}

const SLACK_WEBHOOK_URL = 'http://localhost:4000/slack-webhook'; //process.env.SLACK_WEBHOOK_URL || // Default to local for testing

const SEVERITY_EMOJI = {
  warning: '⚠️',
  critical: '🔴',
};

export async function triggerAlert(alert: AlertPayload) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping alert');
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: `${SEVERITY_EMOJI[alert.severity]} *${alert.severity.toUpperCase()} ALERT*\n${alert.message}\n_Server: ${alert.serverId} | Metric: ${alert.metric} | Value: ${alert.value.toFixed(1)}%_`,
    });
  } catch (err) {
    console.error('Slack webhook failed:', err);
  }
}