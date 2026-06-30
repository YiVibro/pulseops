import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ServerCard from '../components/ServerCard';
import AlertsPanel from '../components/AlertsPanel';
import { useSocket } from '../hooks/useSocket';
import type { ServerStatus, AnomalyAlert, ServerMetrics } from '../types';
import { Server, Wifi, WifiOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard: React.FC = () => {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize bootstrap structural layouts from REST endpoints
  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [serversRes, alertsRes] = await Promise.all([
          axios.get(`${API_URL}/servers`, { headers }),
          axios.get(`${API_URL}/alerts`, { headers })
        ]);

        setServers(serversRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error("Infrastructure topology sync failure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopology();
  }, []);

  // Handle incoming live stream frames from agent cluster
  const handleMetricsUpdate = useCallback((payload: ServerMetrics) => {
    setServers((prevServers) =>
      prevServers.map((server) => {
        if (server.id !== payload.serverId) return server;

        const newHistory = [...server.history, {
          cpu: payload.cpu,
          memory: payload.memory,
          disk: payload.disk,
          timestamp: payload.timestamp
        }].slice(-60); // Constrain sliding active trace timeline size to 60 points

        // Local inline warning evaluation triggers
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (payload.cpu > 90 || payload.memory > 90) status = 'critical';
        else if (payload.cpu > 75 || payload.memory > 75) status = 'warning';

        return { ...server, status, history: newHistory };
      })
    );
  }, []);

  const handleNewAlert = useCallback((alert: AnomalyAlert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50));
  }, []);

  const { isConnected } = useSocket(handleMetricsUpdate, handleNewAlert);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-sm font-mono tracking-widest text-gray-500 gap-4">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        SYNCHRONIZING INFRASTRUCTURE TOPOLOGY...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-white">SYSTEM CLUSTER TOPOLOGY</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">REAL-TIME TELEMETRY FEED WORKSPACE</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
          isConnected ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-red-950/30 border-red-800 text-red-400'
        }`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isConnected ? 'NODE STREAM LINKED' : 'PIPELINE OFFLINE'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Core Node Grid Matrix */}
        <div className="lg:col-span-3">
          {servers.length === 0 ? (
            <div className="bg-[#1f2833]/10 border border-gray-800 border-dashed rounded-xl p-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <Server className="w-8 h-8 text-gray-700" />
              <span>No cluster nodes mapped to this controller context.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Side Stream Panel */}
        <div className="lg:col-span-1">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;