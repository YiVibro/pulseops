import pool from '../db/client.js';
import { triggerAlert } from '../alerts/slackWebhook.js';

const WINDOW_SIZE = 20; // last 20 readings for rolling stats
const THRESHOLDS = {
  warning: 2.0,  // 2 standard deviations
  critical: 3.0, // 3 standard deviations
};

// In-memory rolling window per server per metric
const windows: Record<string, Record<string, number[]>> = {};

function getWindow(serverId: string, metric: string): number[] {
  if (!windows[serverId]) windows[serverId] = {};
  if (!windows[serverId][metric]) windows[serverId][metric] = [];
  return windows[serverId][metric];
}

function calcMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calcStdDev(values: number[], mean: number): number {
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calcZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return Math.abs((value - mean) / stdDev);
}

// change the function signature to return anomaly data instead of side effects
export async function detectAnomaly(
  serverId: string,
  metric: string,
  value: number
): Promise<{ severity: 'warning' | 'critical'; message: string } | null> {

  const window = getWindow(serverId, metric);

  if (window.length < WINDOW_SIZE) {
    window.push(value);
    return null;
  }

  const mean = calcMean(window);
  const stdDev = calcStdDev(window, mean);
  const zScore = calcZScore(value, mean, stdDev);

  let severity: 'warning' | 'critical' | null = null;
  if (zScore >= THRESHOLDS.critical) severity = 'critical';
  else if (zScore >= THRESHOLDS.warning) severity = 'warning';

  // slide window
  window.push(value);
  if (window.length > WINDOW_SIZE) window.shift();

  if (!severity) return null;

  const message = `${metric.toUpperCase()} spike on ${serverId}: ${value.toFixed(1)}% (z-score: ${zScore.toFixed(2)})`;

  // save to DB
  await pool.query(
    `INSERT INTO alerts (server_id, metric, value, severity, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [serverId, metric, value, severity, message]
  );

  // fire Slack
  await triggerAlert({ serverId, metric, value, severity, message });

  return { severity, message };
}