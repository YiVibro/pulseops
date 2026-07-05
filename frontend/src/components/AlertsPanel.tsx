import { AlertTriangle, AlertCircle, Bell } from 'lucide-react';
import type { Alert } from '../types';

interface Props { alerts: Alert[]; }

const SEVERITY_COLOR = {
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

const SEVERITY_BG = {
  warning: 'rgba(245,158,11,0.08)',
  critical: 'rgba(239,68,68,0.08)',
};

function timeAgo(ts: number | string | undefined): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AlertsPanel({ alerts }: Props) {
  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        maxHeight: '480px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Anomaly Feed
          </span>
        </div>
        {alerts.length > 0 && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--critical)' }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No anomalies detected</p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>All metrics within baseline</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={alert.id || i}
              className="flex items-start gap-3 px-4 py-3 border-b transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: i === 0 ? SEVERITY_BG[alert.severity] : 'transparent',
              }}
            >
              <div className="mt-0.5">
                <AlertTriangle
                  className="w-4 h-4"
                  style={{ color: SEVERITY_COLOR[alert.severity] }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className="text-xs font-mono font-semibold uppercase"
                    style={{ color: SEVERITY_COLOR[alert.severity] }}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(alert.timestamp || alert.created_at)}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {alert.serverId}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: SEVERITY_COLOR[alert.severity] }}
                  >
                    {alert.value?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
