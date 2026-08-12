import { useState, useEffect, useCallback } from 'react';
import { Server, RefreshCw, AlertTriangle, ShieldCheck, Cpu, Database } from 'lucide-react';
import { ServerCard } from '../components/ServerCard';
import AlertsPanel from '../components/AlertsPanel';
import { useSocket } from '../hooks/useSocket';
import type { Server as ServerType, Alert, MetricPoint } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const MAX_HISTORY = 60;

export default function Dashboard() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      const [serversRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/servers`),// { headers }
        fetch(`${API_URL}/alerts?limit=30`),//{ headers }
      ]);
      const serversData = await serversRes.json();
      console.log('Fetched servers:', serversData);
      const alertsData = await alertsRes.json();
      setServers(Array.isArray(serversData) ? serversData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error('Fetch engine diagnostic exception:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchInitial(); 
  }, [fetchInitial]);

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
        let status: ServerType['status'] = 'healthy';
        if (data.cpu > 90 || data.memory > 90) status = 'critical';
        else if (data.cpu > 75 || data.memory > 75) status = 'warning';
        return { ...s, history: newHistory, status };
      }));
    },
    onAlert: (alert) => {
      setAlerts(prev => [{ ...alert, timestamp: Date.now() }, ...prev].slice(0, 50));
    },
  });

  const healthyCount = servers.filter(s => s.status === 'healthy').length;
  const warningCount = servers.filter(s => s.status === 'warning').length;
  const criticalCount = servers.filter(s => s.status === 'critical').length;

  return (
    /* Added px-4 sm:px-6 md:px-8 max-w-7xl mx-auto to step layout strictly off screen borders */
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-8 animate-fadeIn text-left font-mono">
      
      {/* Header Segment Grid */}
      <div className="flex flex-row items-center justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            System <span style={{ color: 'var(--neon-cyan)' }}>Architecture</span> Overview
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
            Telemetry stream operational // tracking {servers.length} target node clusters
          </p>
        </div>
        
        <button 
          onClick={fetchInitial}
          className="flex flex-row items-center gap-2 px-4 py-2 border border-[var(--neon-cyan)] text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 hover:bg-[var(--neon-cyan)]/10 font-bold transition-all uppercase tracking-wider text-xs cursor-pointer"
          style={{ boxShadow: '0 0 10px rgba(0,240,255,0.1)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Diagnostics</span>
        </button>
      </div>

      {/* Cyber Metrics Diagnostic Cards Counter Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-lg flex flex-row items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Node_State_Ok</p>
            <p className="text-3xl font-black mt-1" style={{ color: 'var(--neon-green)' }}>{healthyCount}</p>
          </div>
          <ShieldCheck className="w-8 h-8 opacity-40" style={{ color: 'var(--neon-green)' }} />
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-lg flex flex-row items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Node_State_Warn</p>
            <p className="text-3xl font-black mt-1" style={{ color: 'var(--neon-yellow)' }}>{warningCount}</p>
          </div>
          <AlertTriangle className="w-8 h-8 opacity-40" style={{ color: 'var(--neon-yellow)' }} />
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-lg flex flex-row items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Node_State_Crit</p>
            <p className="text-3xl font-black mt-1" style={{ color: 'var(--neon-pink)' }}>{criticalCount}</p>
          </div>
          <AlertTriangle className="w-8 h-8 opacity-40" style={{ color: 'var(--neon-pink)' }} />
        </div>
      </div>

      {/* Main Workspace Layout Matrix Splitter - Switched layout structure to standard responsive gap flow */}
      <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
        
        {/* Left Side: Server Clusters Registry Stack */}
        <div className="w-full lg:w-2/3 space-y-4">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-1 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> 
            <span>[// Monitor Cluster Registry]</span>
          </div>

          {loading && servers.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-40 rounded bg-zinc-900/20 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : servers.length === 0 ? (
            <div className="cyber-panel p-8 text-center rounded border border-zinc-800/80">
              <div className="inline-flex p-4 rounded bg-zinc-950 border border-zinc-800 mb-4">
                <Server className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-md font-bold tracking-wider text-zinc-300 uppercase">No active instances registered</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-mono">
                Initialize the tracking node daemon process onto a host machine target to capture metrics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Operational Live Threat Feeds Panel */}
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-1 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--neon-pink)]" /> 
            <span>[// Kernel Incident Telemetry Feed]</span>
          </div>
          <AlertsPanel alerts={alerts} />
        </div>

      </div>
    </div>
  );
}