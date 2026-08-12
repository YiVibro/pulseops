import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import ServerCard from '../components/ServerCard';
import AlertsPanel from '../components/AlertsPanel';
import { useSocket } from '../hooks/useSocket';
import type { Server, Alert, MetricPoint } from '../types';
import { Layers, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const MAX_HISTORY = 60;

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchInitial = useCallback(async () => {
    try {
      const [serversRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/servers`, { headers }),
        fetch(`${API_URL}/alerts?limit=30`, { headers }),
      ]);
      const serversData = await serversRes.json();
      console.log("resp",serversData);
      const alertsData = await alertsRes.json();
      setServers(Array.isArray(serversData) ? serversData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  useSocket({
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
    onMetric: (data) => {
      setServers(prev => prev.map(s => {
        if (s.id !== data.serverId) return s;
        const point: MetricPoint = {
          timestamp: data.timestamp,
          cpu: data.cpu,
          memory: data.memory,
          disk: data.disk,
        };
        const newHistory = [...s.history, point].slice(-MAX_HISTORY);
        let status: Server['status'] = 'healthy';
        if (data.cpu > 90 || data.memory > 90) status = 'critical';
        else if (data.cpu > 75 || data.memory > 75) status = 'warning';
        return { ...s, history: newHistory, status };
      }));
    },
    onAlert: (alert) => {
      setAlerts(prev => [{ ...alert, timestamp: Date.now() }, ...prev].slice(0, 50));
    },
  });

  const criticalCount = servers.filter(s => s.status === 'critical').length;
  const warningCount = servers.filter(s => s.status === 'warning').length;
  const healthyCount = servers.filter(s => s.status === 'healthy').length;

  return (
    <Layout connected={connected}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Infrastructure Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time telemetry across {servers.length} node{servers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchInitial}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Healthy', count: healthyCount, color: 'var(--healthy)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Warning', count: warningCount, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Critical', count: criticalCount, color: 'var(--critical)', bg: 'rgba(239,68,68,0.08)' },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span
              className="text-2xl font-mono font-bold"
              style={{ color }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Server grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-xl p-5 animate-pulse"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height: '200px' }}
                />
              ))}
            </div>
          ) : servers.length === 0 ? (
            <div
              className="rounded-xl flex flex-col items-center justify-center py-20"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Layers className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                No servers registered
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                Start an agent to begin monitoring
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {servers.map(server => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </div>

        {/* Alerts panel */}
        <div className="w-80 flex-shrink-0">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </Layout>
  );
}
