import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MetricChart from '../components/MetricChart';
import { useSocket } from '../hooks/useSocket';
import type { MetricData, ServerMetrics } from '../types';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ServerDetail: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const [history, setHistory] = useState<MetricData[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [serverName, setServerName] = useState('Node Detail Workspace');
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/metrics/${serverId}?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.metrics);
      setServerName(res.data.name);
    } catch (err) {
      console.error("Historical ledger parsing failure:", err);
    } finally {
      setLoading(false);
    }
  }, [serverId, timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Capture updates in real-time if the selected historical window matches active telemetry timelines
  const handleLiveMetrics = useCallback((payload: ServerMetrics) => {
    if (payload.serverId !== serverId) return;
    setHistory((prev) => [...prev, {
      cpu: payload.cpu,
      memory: payload.memory,
      disk: payload.disk,
      timestamp: payload.timestamp
    }].slice(-100)); // Maintain limited bounds during long tracing sessions
  }, [serverId]);

  useSocket(handleLiveMetrics);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-800/60 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 border border-gray-800 rounded-lg bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white uppercase">{serverName}</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">NODE ARCHIVAL CORRIDOR OVERVIEW // {serverId}</p>
          </div>
        </div>

        {/* Interval Range Toggles */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-950 border border-gray-800 p-1 rounded-lg flex gap-1 font-mono text-xs">
            {['1h', '6h', '24h'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md uppercase tracking-wider font-semibold transition duration-150 ${
                  timeRange === range ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchHistory}
            className="p-2.5 bg-[#1f2833]/20 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="h-[50vh] flex items-center justify-center text-sm font-mono text-gray-500 tracking-widest">
          PARSING TIMESCALEDB COMPRESSION CHUNKS...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricChart data={history} dataKey="cpu" color="#06b6d4" label="Processor (CPU)" />
          <MetricChart data={history} dataKey="memory" color="#a855f7" label="System Memory (RAM)" />
          <div className="md:col-span-2">
            <MetricChart data={history} dataKey="disk" color="#10b981" label="Storage Partition (Disk)" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDetail;