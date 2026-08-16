import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Cpu, HardDrive, Layers, Wifi, Terminal, Server, ShieldCheck, ShieldAlert } from 'lucide-react';
import { AddServerModal } from '../components/AddServerModal';
import { supabase } from '../lib/supabase';

export interface NetworkInterface {
  name: string;
  download: string;
  upload: string;
}

export interface DiskPartition {
  name: string;
  usedGiB: number;
  totalGiB: number;
  percent: number;
}

export interface DynamicServerMetrics {
  serverId: string;
  serverName: string;
  ipAddress: string;
  uptime: string;
  status: 'healthy' | 'warning' | 'critical';
  cpuTotal: number;
  cpuCores: number[];
  memory: {
    usedGiB: number;
    totalGiB: number;
    percent: number;
    swapUsedGiB: number;
  };
  disks: DiskPartition[];
  network: NetworkInterface[];
}

const AsciiBar = ({ percent, color = 'text-[#45f3ff]' }: { percent: number; color?: string }) => {
  const totalBlocks = 16;
  const filledBlocks = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  return <span className={`font-mono font-bold ${color}`}>{bar}</span>;
};

const TerminalDashboard = () => {
  const [servers, setServers] = useState<Record<string, DynamicServerMetrics>>({});
  const [activeServerId, setActiveServerId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch user registered servers from Supabase
  useEffect(() => {
    async function loadUserServers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('servers')
          .select('id, label, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const initialMap: Record<string, DynamicServerMetrics> = {};
          data.forEach((s: any) => {
            initialMap[s.id] = {
              serverId: s.id,
              serverName: s.label || s.id,
              ipAddress: '172.31.4.225',
              uptime: 'LIVE',
              status: 'healthy',
              cpuTotal: 0,
              cpuCores: [0],
              memory: { usedGiB: 0, totalGiB: 8.0, percent: 0, swapUsedGiB: 0 },
              disks: [{ name: '/ (root)', usedGiB: 0, totalGiB: 30.0, percent: 0 }],
              network: [{ name: 'eth0', download: 'Active', upload: 'Active' }],
            };
          });

          setServers(initialMap);
          setActiveServerId(data[0].id);
        }
      } catch (err: any) {
        console.error('[SUPABASE FETCH ERROR]:', err?.message || err);
      } finally {
        setLoading(false);
      }
    }

    loadUserServers();
  }, []);

  // 2. Telemetry ingestion handler
  const handleSocketMessage = useCallback((payload: any) => {
    if (!payload?.serverId) return;

    const targetId = payload.serverId;

    setServers((prev) => {
      const existing = prev[targetId] || {
        serverId: targetId,
        serverName: targetId,
        ipAddress: '172.31.4.225',
        uptime: 'LIVE',
      };

      const cpuLoad = Math.round(Number(payload.cpu ?? 0));
      const memPercent = Math.round(Number(payload.memory ?? 0));
      const diskPercent = Math.round(Number(payload.disk ?? 0));

      return {
        ...prev,
        [targetId]: {
          ...existing,
          serverId: targetId,
          serverName: existing.serverName || targetId,
          ipAddress: payload.ipAddress || existing.ipAddress || '172.31.4.225',
          uptime: payload.timestamp ? new Date(payload.timestamp).toLocaleTimeString() : 'LIVE',
          status: cpuLoad > 85 || memPercent > 90 ? 'warning' : 'healthy',

          // CPU
          cpuTotal: cpuLoad,
          cpuCores: payload.cpuCores && payload.cpuCores.length > 0 ? payload.cpuCores : [cpuLoad],

          // Memory
          memory: {
            totalGiB: payload.memoryTotal || existing.memory?.totalGiB || 8.0,
            usedGiB: Number((((payload.memoryTotal || 8.0) * memPercent) / 100).toFixed(1)),
            percent: memPercent,
            swapUsedGiB: 0,
          },

          // Disks
          disks: payload.disks && payload.disks.length > 0 ? payload.disks : [
            {
              name: '/ (root)',
              usedGiB: Number(((30.0 * diskPercent) / 100).toFixed(1)),
              totalGiB: 30.0,
              percent: diskPercent,
            },
          ],

          // Network
          network: payload.network && payload.network.length > 0 ? payload.network : [
            {
              name: 'eth0',
              download: payload.download || 'Active',
              upload: payload.upload || 'Active',
            },
          ],
        },
      };
    });

    // Auto switch active server if none set
    setActiveServerId((current) => current || targetId);
  }, []);

  useSocket({ onMessage: handleSocketMessage });

  const currentServer = servers[activeServerId] || Object.values(servers)[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-6 flex items-center justify-center">
        <span className="animate-pulse text-cyan-400">LOADING REGISTERED NODES FROM SUPABASE...</span>
      </div>
    );
  }

  if (!currentServer) {
    return (
      <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-6 flex flex-col items-center justify-center space-y-4">
        <span className="text-yellow-400 font-bold">NO ACTIVE SERVERS LINKED TO THIS ACCOUNT</span>
        <p className="text-xs text-gray-500">Click below to onboard a target machine using the setup script.</p>
        <AddServerModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-4 select-none">
      {/* Top Header Bar */}
      <div className="border border-gray-800 bg-[#0b0c10] px-4 py-2 flex flex-wrap justify-between items-center text-xs text-gray-400 mb-3 gap-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span>VORTEX-TUI v2.0 // MULTI-NODE OBSERVER</span>
        </div>

        <div className="flex items-center gap-4">
          <div>SYS_UPTIME: {currentServer.uptime || 'N/A'}</div>
          <div className="flex items-center gap-2 font-bold">
            {currentServer.status === 'healthy' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> NOMINAL
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> ATTENTION REQUIRED
              </span>
            )}
          </div>
          <AddServerModal />
        </div>
      </div>

      {/* Node Selector Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 border-b border-gray-900">
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-2">
          <Server className="w-3.5 h-3.5 text-cyan-400" /> CLUSTER NODES ({Object.keys(servers).length}):
        </span>
        {Object.values(servers).map((srv) => (
          <button
            key={srv.serverId}
            onClick={() => setActiveServerId(srv.serverId)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 border ${
              activeServerId === srv.serverId
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-[#0b0c10] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${srv.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {srv.serverName}
            <span className="text-[10px] opacity-60 font-mono">({srv.serverId})</span>
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CPU */}
        <div className="border border-cyan-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-cyan-400 font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3" /> 1. CPU PROCESSOR ({currentServer.cpuCores?.length || 1} CORES)
          </span>

          <div className="space-y-2 mt-1">
            <div className="flex justify-between text-xs">
              <span>TOTAL LOAD</span>
              <span className="text-cyan-400 font-bold">{currentServer.cpuTotal || 0}%</span>
            </div>
            <AsciiBar percent={currentServer.cpuTotal || 0} color={currentServer.cpuTotal > 80 ? 'text-red-500' : 'text-cyan-400'} />

            <div className="pt-3 border-t border-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto custom-scrollbar">
              {currentServer.cpuCores?.map((val, idx) => (
                <div key={idx} className="flex justify-between items-center text-gray-400 bg-black/40 px-2 py-1 rounded">
                  <span>Core {idx}:</span>
                  <div className="flex items-center gap-2">
                    <AsciiBar percent={val} color={val > 85 ? 'text-red-400' : 'text-emerald-400'} />
                    <span className="w-7 text-right font-bold text-gray-300">{val}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="border border-purple-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-purple-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> 2. MEMORY
          </span>

          <div className="space-y-3 mt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white font-bold">{currentServer.memory?.totalGiB || 0} GiB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Used:</span>
              <span className="text-purple-400 font-bold">
                {currentServer.memory?.usedGiB || 0} GiB ({currentServer.memory?.percent || 0}%)
              </span>
            </div>
            <AsciiBar percent={currentServer.memory?.percent || 0} color={currentServer.memory?.percent > 90 ? 'text-red-500' : 'text-purple-400'} />

            <div className="pt-2 text-[10px] text-gray-500 flex justify-between border-t border-gray-900">
              <span>SWAP USED: {currentServer.memory?.swapUsedGiB || 0} GiB</span>
              <span>FREE: {((currentServer.memory?.totalGiB || 0) - (currentServer.memory?.usedGiB || 0)).toFixed(1)} GiB</span>
            </div>
          </div>
        </div>

        {/* Disks */}
        <div className="border border-emerald-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> 3. STORAGE PARTITIONS ({currentServer.disks?.length || 1})
          </span>

          <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
            {currentServer.disks?.map((disk, idx) => (
              <div key={idx} className="space-y-1 bg-black/30 p-2 rounded border border-gray-900">
                <div className="flex justify-between text-gray-300">
                  <span className="font-bold text-white">{disk.name}</span>
                  <span className="text-emerald-400 font-bold">{disk.percent}%</span>
                </div>
                <AsciiBar percent={disk.percent} color={disk.percent > 85 ? 'text-red-400' : 'text-emerald-400'} />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Free: {(disk.totalGiB - disk.usedGiB).toFixed(1)} GiB</span>
                  <span>Used: {disk.usedGiB} / {disk.totalGiB} GiB</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network */}
        <div className="border border-blue-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-blue-400 font-bold flex items-center gap-1">
            <Wifi className="w-3 h-3" /> 4. NETWORK INTERFACES ({currentServer.network?.length || 1})
          </span>

          <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
            {currentServer.network?.map((net, idx) => (
              <div key={idx} className="p-2 border border-gray-900 bg-black/50 rounded space-y-1.5">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{net.name}</div>
                <div className="flex justify-between text-gray-300">
                  <span>▼ DOWNLOAD:</span>
                  <span className="text-blue-400 font-bold font-mono">{net.download}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>▲ UPLOAD:</span>
                  <span className="text-purple-400 font-bold font-mono">{net.upload}</span>
                </div>
              </div>
            ))}

            <div className="text-[10px] text-gray-600 font-mono text-center pt-1 border-t border-gray-900">
              IP: {currentServer.ipAddress || 'N/A'} // STATUS: ACTIVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalDashboard;