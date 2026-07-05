import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import type { MetricPoint, MetricKey } from '../types';

interface Props {
  data: MetricPoint[];
  metric: MetricKey;
  height?: number;
  showAxes?: boolean;
  color?: string;
}

const METRIC_COLORS: Record<MetricKey, string> = {
  cpu: '#3b82f6',
  memory: '#8b5cf6',
  disk: '#06b6d4',
};

const METRIC_LABELS: Record<MetricKey, string> = {
  cpu: 'CPU',
  memory: 'MEM',
  disk: 'DISK',
};

export default function MetricChart({ data, metric, height = 60, showAxes = false, color }: Props) {
  const lineColor = color || METRIC_COLORS[metric];
  const latest = data[data.length - 1]?.[metric] ?? 0;

  return (
    <div>
      {showAxes && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
            {METRIC_LABELS[metric]}
          </span>
          <span className="text-sm font-mono font-semibold" style={{ color: lineColor }}>
            {latest.toFixed(1)}%
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${metric}-${lineColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxes && (
            <>
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--text-primary)',
                }}
                formatter={(val) =>{
                  if(typeof val!== "number"){
                    return [String(val), METRIC_LABELS[metric]];
                  }
                  return [`${val.toFixed(1)}%`, METRIC_LABELS[metric]];
                } }
                labelFormatter={() => ''}
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey={metric}
            stroke={lineColor}
            strokeWidth={1.5}
            fill={`url(#grad-${metric}-${lineColor})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!showAxes && (
        <div className="metric-bar mt-1">
          <div
            className="metric-bar-fill"
            style={{
              width: `${latest}%`,
              background: latest > 90 ? 'var(--critical)' : latest > 75 ? 'var(--warning)' : lineColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
