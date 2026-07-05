import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricChart from '../components/MetricChart';
import { useSocket } from '../hooks/useSocket';
import type { MetricPoint } from '../types';
import { ArrowLeft, Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const MAX_HISTORY = 200;

const RANGES = ['1h', '6h', '24h'] as const;
type Range = typeof RANGES[number];

export default function ServerDetail() {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [serverName, setServerName] = useState(serverId || '');
  const [range, setRange] = useState<Range>('1h');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchHistory = useCallback(async () => {
    if (!serverId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/metrics/${serverId}?range=${range}`, { headers });
      const data = await res.json();
      // handle both { metrics, name } shape and raw array
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory(data.metrics || []);
        if (data.name) setServerName(data.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverId, range]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useSocket({
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
    onMetric: (data) => {
      if (data.serverId !== serverId) return;
      const point: MetricPoint = {
        timestamp: data.timestamp,
        cpu: data.cpu,
        memory: data.memory,
        disk: data.disk,
      };
      setHistory(prev => [...prev, point].slice(-MAX_HISTORY));
    },
  });

  const latest = history[history.length - 1];

  const metrics = [
    { key: 'cpu' as const, label: 'CPU Usage', icon: Cpu, color: '#3b82f6' },
    { key: 'memory' as const, label: 'Memory Usage', icon: MemoryStick, color: '#8b5cf6' },
    { key: 'disk' as const, label: 'Disk Usage', icon: HardDrive, color: '#06b6d4' },
  ];

  return (
    <Layout connected={connected}>
      {/* Back + header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(59,130,246,0.1)' }}
          >
            <Server className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{serverName}</h1>
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{serverId}</p>
          </div>
        </div>
      </div>

      {/* Live stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {metrics.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <p className="text-3xl font-mono font-bold" style={{ color }}>
              {(latest?.[key] ?? 0).toFixed(1)}
              <span className="text-lg">%</span>
            </p>
          </div>
        ))}
      </div>

      {/* Time range selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Historical metrics
        </h2>
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 rounded-md text-xs font-mono transition-all"
              style={{
                background: range === r ? 'var(--accent)' : 'transparent',
                color: range === r ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4">
        {metrics.map(({ key, label, color }) => (
          <div
            key={key}
            className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
              <span className="text-sm font-mono font-bold" style={{ color }}>
                {(latest?.[key] ?? 0).toFixed(1)}%
              </span>
            </div>
            {loading ? (
              <div className="h-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
            ) : (
              <MetricChart data={history} metric={key} height={100} showAxes color={color} />
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
