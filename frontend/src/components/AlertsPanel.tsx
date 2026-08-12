import { AlertTriangle, AlertCircle, Bell } from 'lucide-react';
import type { Alert } from '../types';

interface Props { alerts: Alert[]; }

const SEVERITY_COLOR = {
  warning: 'var(--neon-yellow)',
  critical: 'var(--neon-pink)',
};

const SEVERITY_BG = {
  warning: 'rgba(254, 254, 0, 0.05)',
  critical: 'rgba(255, 0, 127, 0.05)',
};

function timeAgo(ts: number | string | undefined): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AlertsPanel({ alerts = [] }: Props) {
  return (
    <div
      className="rounded flex flex-col w-full font-mono text-left"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        maxHeight: '480px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Panel Header */}
      <div
        className="flex flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0, 240, 255, 0.15)' }}
      >
        <div className="flex flex-row items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--neon-cyan)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white">
            // INCIDENT_STREAM
          </span>
        </div>
        {alerts.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider"
            style={{ 
              borderColor: 'var(--neon-pink)', 
              color: 'var(--neon-pink)',
              backgroundColor: 'rgba(255,0,127,0.1)' 
            }}
          >
            {alerts.length} THREATS
          </span>
        )}
      </div>

      {/* Dynamic Incidents Stream List */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="p-3 rounded-full border border-zinc-800 bg-zinc-950/50">
              <AlertCircle className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">FEED_SECURE</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">All metrics within operational baseline.</p>
            </div>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={alert.id || i}
              className="flex flex-row items-start gap-3 px-4 py-3.5 border-b transition-colors hover:bg-zinc-900/30"
              style={{
                borderColor: 'rgba(24, 24, 37, 0.8)',
                background: i === 0 ? SEVERITY_BG[alert.severity] : 'transparent',
              }}
            >
              {/* Threat Level Icon Indicator */}
              <div className="mt-0.5 flex-shrink-0">
                <AlertTriangle
                  className="w-4 h-4"
                  style={{ color: SEVERITY_COLOR[alert.severity] }}
                />
              </div>

              {/* Threat Payload Context Metadata */}
              <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                <div className="flex flex-row items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-black tracking-wider uppercase"
                    style={{ color: SEVERITY_COLOR[alert.severity] }}
                  >
                    [{alert.severity}]
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {timeAgo(alert.timestamp || alert.created_at)}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-300 break-words font-mono">
                  {alert.message}
                </p>

                {/* Machine Target Matrix Mapping Footer */}
                <div className="flex flex-row items-center gap-2 mt-1 text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase tracking-tight">Node:</span>
                  <span className="text-[var(--neon-cyan)] truncate font-semibold">
                    {alert.serverId || 'sys-host-unknown'}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span
                    className="font-bold"
                    style={{ color: SEVERITY_COLOR[alert.severity] }}
                  >
                    V_CRIT: {alert.value?.toFixed(1) ?? '0.0'}%
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