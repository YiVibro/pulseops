import { useNavigate } from 'react-router-dom';
import { Server, Cpu, HardDrive, MemoryStick, ChevronRight } from 'lucide-react';
import MetricChart from './MetricChart';
import type { Server as ServerType } from '../types';

interface Props { server: ServerType; }

const STATUS_COLORS = {
  healthy: 'var(--healthy)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
  offline: 'var(--text-secondary)',
};

const STATUS_BG = {
  healthy: 'rgba(16,185,129,0.1)',
  warning: 'rgba(245,158,11,0.1)',
  critical: 'rgba(239,68,68,0.1)',
  offline: 'rgba(100,116,139,0.1)',
};

export default function ServerCard({ server }: Props) {
  const navigate = useNavigate();
  const latest = server.history[server.history.length - 1];

  return (
    <div
      onClick={() => navigate(`/dashboard/${server.id}`)}
      className="rounded-xl p-5 cursor-pointer transition-all duration-200 group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)';
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: STATUS_BG[server.status] }}
          >
            <Server className="w-4 h-4" style={{ color: STATUS_COLORS[server.status] }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {server.name}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              {server.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono"
            style={{ background: STATUS_BG[server.status], color: STATUS_COLORS[server.status] }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${server.status !== 'offline' ? 'pulse-dot' : ''}`}
              style={{ background: STATUS_COLORS[server.status] }}
            />
            {server.status}
          </div>
          <ChevronRight
            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <MetricChart data={server.history} metric="cpu" height={48} />
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'cpu' as const, label: 'CPU', icon: Cpu, color: '#3b82f6' },
          { key: 'memory' as const, label: 'MEM', icon: MemoryStick, color: '#8b5cf6' },
          { key: 'disk' as const, label: 'DISK', icon: HardDrive, color: '#06b6d4' },
        ].map(({ key, label, icon: Icon, color }) => (
          <div key={key}>
            <div className="flex items-center gap-1 mb-1">
              <Icon className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <p className="text-sm font-mono font-semibold" style={{ color }}>
              {(latest?.[key] ?? 0).toFixed(1)}%
            </p>
            <div className="metric-bar mt-1">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${latest?.[key] ?? 0}%`,
                  background: (latest?.[key] ?? 0) > 90 ? 'var(--critical)'
                    : (latest?.[key] ?? 0) > 75 ? 'var(--warning)' : color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
