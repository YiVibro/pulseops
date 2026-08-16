import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { AddServerModal } from '../components/AddServerModal';
import { supabase } from '../lib/supabase';

interface TelemetryState {
  serverId: string;
  serverName: string;
  ipAddress: string;
  uptime: string;
  timestamp: string;
  cpu: {
    usage: number;
    model: string;
    loadAvg: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    cached: number;
    free: number;
  };
  disks: Array<{
    name: string;
    totalMiB: number;
    usedMiB: number;
    percent: number;
  }>;
  network: {
    iface: string;
    rxRate: string;
    txRate: string;
    totalRx: string;
    totalTx: string;
  };
}

// Btop Block Generator
const BtopBlockBar = ({ percent, length = 20 }: { percent: number; length?: number }) => {
  const filled = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * length);
  const empty = length - filled;

  return (
    <span className="font-mono tracking-tighter text-xs">
      <span className={percent > 80 ? 'text-[#ff5555]' : percent > 50 ? 'text-[#e5c07b]' : 'text-[#98c379]'}>
        {'█'.repeat(filled)}
      </span>
      <span className="text-[#3e4451]">{'█'.repeat(empty)}</span>
    </span>
  );
};

// Gradient Micro Dot Sparkline
const MicroGraph = ({ percent }: { percent: number }) => {
  const dots = ['⣀', '⣤', '⣶', '⣿'];
  const char = dots[Math.min(Math.floor((percent / 100) * dots.length), dots.length - 1)] || '⣀';
  return <span className="text-[#61afef] tracking-widest">{char.repeat(12)}</span>;
};

export const TerminalDashboard: React.FC = () => {
  const [servers, setServers] = useState<Record<string, TelemetryState>>({});
  const [activeServerId, setActiveServerId] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Initial Server Sync
  useEffect(() => {
    async function loadServers() {
      const { data } = await supabase.from('servers').select('id, label').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const initial: Record<string, TelemetryState> = {};
        data.forEach((s: any) => {
          initial[s.id] = {
            serverId: s.id,
            serverName: s.label || s.id,
            ipAddress: '172.31.4.225',
            uptime: '0m',
            timestamp: '',
            cpu: { usage: 0, model: 'E5-2686 v4', loadAvg: '0.00 0.00 0.00' },
            memory: { total: 1024, used: 0, available: 1024, cached: 0, free: 1024 },
            disks: [{ name: 'root', totalMiB: 8000, usedMiB: 0, percent: 0 }],
            network: { iface: 'eth0', rxRate: '0.0 KiB/s', txRate: '0.0 KiB/s', totalRx: '0 GiB', totalTx: '0 MiB' },
          };
        });
        setServers(initial);
        setActiveServerId(data[0].id);
      }
    }
    loadServers();
  }, []);

  // Ingest Real-time Metric Updates
  const handleSocketMessage = useCallback((payload: any) => {
    if (!payload?.serverId) return;
    const sid = payload.serverId;

    setServers((prev) => {
      const curr = prev[sid] || {};
      const cpuUsage = Math.round(payload.cpu?.usage ?? payload.cpu ?? 0);
      const memTotal = payload.memory?.total || 1024;
      const memUsed = payload.memory?.used || Math.round((memTotal * (payload.memory || 0)) / 100);

      return {
        ...prev,
        [sid]: {
          serverId: sid,
          serverName: curr.serverName || sid,
          ipAddress: payload.ipAddress || curr.ipAddress || '172.31.4.225',
          uptime: payload.uptime || curr.uptime || 'up 1d',
          timestamp: payload.timestamp || new Date().toISOString(),
          cpu: {
            usage: cpuUsage,
            model: payload.cpu?.model || curr.cpu?.model || 'E5-2686',
            loadAvg: payload.cpu?.loadAvg || '0.24 0.18 0.15',
          },
          memory: {
            total: memTotal,
            used: memUsed,
            available: payload.memory?.available || memTotal - memUsed,
            cached: payload.memory?.cached || 350,
            free: payload.memory?.free || 120,
          },
          disks: payload.disks || [
            {
              name: 'root',
              totalMiB: 7000,
              usedMiB: Math.round(7000 * ((payload.disk || 50) / 100)),
              percent: payload.disk || 50,
            },
          ],
          network: payload.network || {
            iface: 'eth0',
            rxRate: '4.86 KiB/s',
            txRate: '11.7 KiB/s',
            totalRx: '1.30 GiB',
            totalTx: '221 MiB',
          },
        },
      };
    });

    setActiveServerId((prev) => prev || sid);
  }, []);

  useSocket({ onMessage: handleSocketMessage });

  const active = servers[activeServerId] || Object.values(servers)[0];

  if (!active) {
    return (
      <div className="min-h-screen bg-[#060709] text-[#c5c6c7] font-mono flex items-center justify-center">
        <AddServerModal />
      </div>
    );
  }

  const memPct = Math.round((active.memory.used / (active.memory.total || 1)) * 100);
  const availPct = Math.round((active.memory.available / (active.memory.total || 1)) * 100);
  const cachedPct = Math.round((active.memory.cached / (active.memory.total || 1)) * 100);
  const freePct = Math.round((active.memory.free / (active.memory.total || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#07080a] text-[#abb2bf] font-mono p-3 select-none flex flex-col gap-2">
      {/* Top Bar / Node Selector */}
      <div className="flex justify-between items-center bg-[#0d0f14] border border-[#1e222b] px-3 py-1.5 rounded text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#98c379] font-bold text-[11px]">● PULSEOPS-TUI</span>
          <div className="flex gap-1">
            {Object.values(servers).map((s) => (
              <button
                key={s.serverId}
                onClick={() => setActiveServerId(s.serverId)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                  activeServerId === s.serverId
                    ? 'bg-[#1e2430] border-[#61afef] text-[#61afef]'
                    : 'bg-[#090b10] border-[#1e222b] text-[#5c6370] hover:text-[#abb2bf]'
                }`}
              >
                {s.serverName}
              </button>
            ))}
          </div>
        </div>
        <AddServerModal />
      </div>

      {/* 1. CPU SECTION */}
      <div className="border border-[#282c34] bg-[#0d0f14] rounded p-2.5 relative">
        <div className="absolute -top-2 left-3 bg-[#0d0f14] px-1 text-[11px] font-bold text-[#e06c75] flex items-center gap-1">
          <span className="text-[#5c6370]">¹</span>cpu <span className="text-[#5c6370]">┐</span>
          <span className="text-[#abb2bf] ml-1">menu</span> <span className="text-[#5c6370]">┐</span>
          <span className="text-[#e5c07b]">preset *</span>
        </div>
        <div className="absolute -top-2 right-4 bg-[#0d0f14] px-2 text-[11px] text-[#5c6370]">
          {timeStr} <span className="text-[#98c379] ml-2">2000ms +</span>
        </div>

        <div className="flex justify-between items-start mt-2">
          <div className="text-[10px] text-[#5c6370]">{active.uptime}</div>
          <div className="flex flex-col items-end">
            <div className="text-xs font-bold text-[#e5c07b] flex gap-2">
              <span>{active.cpu.model}</span>
              <span className="text-[#5c6370]">2.3 GHz</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#abb2bf] font-bold">CPU</span>
              <BtopBlockBar percent={active.cpu.usage} length={22} />
              <span className="text-xs font-bold text-[#98c379] w-8 text-right">{active.cpu.usage}%</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[#5c6370]">C0</span>
              <MicroGraph percent={active.cpu.usage} />
              <span className="text-xs text-[#98c379] w-8 text-right">{active.cpu.usage}%</span>
            </div>
            <div className="text-[10px] text-[#5c6370] mt-1">
              Load avg: <span className="text-[#abb2bf]">{active.cpu.loadAvg}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MEMORY, DISKS & NETWORK (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* MEMORY BOX */}
        <div className="border border-[#282c34] bg-[#0d0f14] rounded p-2.5 relative">
          <div className="absolute -top-2 left-3 bg-[#0d0f14] px-1 text-[11px] font-bold text-[#61afef]">
            <span className="text-[#5c6370]">²</span>mem
          </div>

          <div className="space-y-1.5 text-xs mt-1">
            <div className="flex justify-between font-bold">
              <span className="text-[#e5c07b]">Total:</span>
              <span className="text-white">{active.memory.total} MiB</span>
            </div>
            <div className="flex justify-between items-center text-[#abb2bf]">
              <span>Used:</span>
              <span>{active.memory.used} MiB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#e06c75] tracking-widest text-[10px]">::::::::</span>
              <span className="text-[#e06c75] font-bold text-[11px]">{memPct}%</span>
            </div>

            <div className="flex justify-between items-center text-[#abb2bf] pt-1">
              <span>Available:</span>
              <span>{active.memory.available} MiB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#e5c07b] tracking-widest text-[10px]">::::::::</span>
              <span className="text-[#e5c07b] font-bold text-[11px]">{availPct}%</span>
            </div>

            <div className="flex justify-between items-center text-[#abb2bf] pt-1">
              <span>Cached:</span>
              <span>{active.memory.cached} MiB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#61afef] tracking-widest text-[10px]">::::::::</span>
              <span className="text-[#61afef] font-bold text-[11px]">{cachedPct}%</span>
            </div>

            <div className="flex justify-between items-center text-[#abb2bf] pt-1">
              <span>Free:</span>
              <span>{active.memory.free} MiB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#98c379] tracking-widest text-[10px]">::::::::</span>
              <span className="text-[#98c379] font-bold text-[11px]">{freePct}%</span>
            </div>
          </div>
        </div>

        {/* DISKS BOX */}
        <div className="border border-[#282c34] bg-[#0d0f14] rounded p-2.5 relative">
          <div className="absolute -top-2 left-3 bg-[#0d0f14] px-1 text-[11px] font-bold text-[#e06c75]">
            <span className="text-[#e06c75]">d</span>isks <span className="text-[#5c6370] ml-2">io</span>
          </div>

          <div className="space-y-2 mt-1 text-xs">
            {active.disks.map((d, i) => (
              <div key={i} className="border-b border-[#1e222b] pb-2 last:border-none">
                <div className="flex justify-between font-bold">
                  <span className="text-[#e5c07b]">{d.name}</span>
                  <span className="text-white">{(d.totalMiB / 1024).toFixed(2)} GiB</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#5c6370] text-[11px]">Used: {d.percent}%</span>
                  <BtopBlockBar percent={d.percent} length={8} />
                  <span className="text-[#abb2bf] font-bold text-[11px]">{(d.usedMiB / 1024).toFixed(2)} GiB</span>
                </div>
                <div className="text-[10px] text-[#5c6370]">IO% 0%</div>
              </div>
            ))}
          </div>
        </div>

        {/* NETWORK BOX */}
        <div className="border border-[#282c34] bg-[#0d0f14] rounded p-2.5 relative">
          <div className="absolute -top-2 left-3 bg-[#0d0f14] px-1 text-[11px] font-bold text-[#e06c75] flex items-center gap-1">
            <span className="text-[#5c6370]">³</span>net <span className="text-[#5c6370]">┐</span>
            <span className="text-[#abb2bf]">{active.ipAddress}</span>
          </div>
          <div className="absolute -top-2 right-3 bg-[#0d0f14] px-1 text-[10px] text-[#5c6370]">
            <span className="text-[#e5c07b]">sync</span> auto zero <span className="text-[#e06c75]">←b</span> {active.network.iface}
          </div>

          <div className="mt-2 text-xs flex flex-col justify-between h-[85%]">
            <div className="flex justify-between items-center text-[10px] text-[#5c6370]">
              <span>15K</span>
              <div className="text-[#61afef] tracking-widest text-xs">⣾⣽⣻⢿⡿</div>
            </div>

            <div className="bg-[#090b10] border border-[#1e222b] p-2 rounded space-y-1.5">
              <div className="text-[11px] font-bold text-[#e5c07b]">download</div>
              <div className="flex justify-between text-[#abb2bf]">
                <span>▼ {active.network.rxRate}</span>
                <span className="text-[#5c6370]">Total: {active.network.totalRx}</span>
              </div>
              <div className="text-[11px] font-bold text-[#e5c07b] pt-1">upload</div>
              <div className="flex justify-between text-[#abb2bf]">
                <span>▲ {active.network.txRate}</span>
                <span className="text-[#5c6370]">Total: {active.network.totalTx}</span>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-[#5c6370] pt-1">
              <span>15K</span>
              <span className="text-[#98c379]">STATUS: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalDashboard;

// import { useState, useEffect, useCallback } from 'react';
// import { useSocket } from '../hooks/useSocket';
// import { Cpu, HardDrive, Layers, Wifi, Terminal, Server, ShieldCheck, ShieldAlert } from 'lucide-react';
// import { AddServerModal } from '../components/AddServerModal';
// import { supabase } from '../lib/supabase';

// export interface NetworkInterface {
//   name: string;
//   download: string;
//   upload: string;
// }

// export interface DiskPartition {
//   name: string;
//   usedGiB: number;
//   totalGiB: number;
//   percent: number;
// }

// export interface DynamicServerMetrics {
//   serverId: string;
//   serverName: string;
//   ipAddress: string;
//   uptime: string;
//   status: 'healthy' | 'warning' | 'critical';
//   cpuTotal: number;
//   cpuCores: number[];
//   memory: {
//     usedGiB: number;
//     totalGiB: number;
//     percent: number;
//     swapUsedGiB: number;
//   };
//   disks: DiskPartition[];
//   network: NetworkInterface[];
// }

// const AsciiBar = ({ percent, color = 'text-[#45f3ff]' }: { percent: number; color?: string }) => {
//   const totalBlocks = 16;
//   const filledBlocks = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * totalBlocks);
//   const emptyBlocks = totalBlocks - filledBlocks;
//   const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
//   return <span className={`font-mono font-bold ${color}`}>{bar}</span>;
// };

// const TerminalDashboard = () => {
//   const [servers, setServers] = useState<Record<string, DynamicServerMetrics>>({});
//   const [activeServerId, setActiveServerId] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(true);

//   // 1. Fetch user registered servers from Supabase
//   useEffect(() => {
//     async function loadUserServers() {
//       try {
//         setLoading(true);
//         const { data, error } = await supabase
//           .from('servers')
//           .select('id, label, created_at')
//           .order('created_at', { ascending: false });

//         if (error) throw error;

//         if (data && data.length > 0) {
//           const initialMap: Record<string, DynamicServerMetrics> = {};
//           data.forEach((s: any) => {
//             initialMap[s.id] = {
//               serverId: s.id,
//               serverName: s.label || s.id,
//               ipAddress: '172.31.4.225',
//               uptime: 'LIVE',
//               status: 'healthy',
//               cpuTotal: 0,
//               cpuCores: [0],
//               memory: { usedGiB: 0, totalGiB: 8.0, percent: 0, swapUsedGiB: 0 },
//               disks: [{ name: '/ (root)', usedGiB: 0, totalGiB: 30.0, percent: 0 }],
//               network: [{ name: 'eth0', download: 'Active', upload: 'Active' }],
//             };
//           });

//           setServers(initialMap);
//           setActiveServerId(data[0].id);
//         }
//       } catch (err: any) {
//         console.error('[SUPABASE FETCH ERROR]:', err?.message || err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadUserServers();
//   }, []);

//   // 2. Telemetry ingestion handler
//   const handleSocketMessage = useCallback((payload: any) => {
//     if (!payload?.serverId) return;

//     const targetId = payload.serverId;

//     setServers((prev) => {
//       const existing = prev[targetId] || {
//         serverId: targetId,
//         serverName: targetId,
//         ipAddress: '172.31.4.225',
//         uptime: 'LIVE',
//       };

//       const cpuLoad = Math.round(Number(payload.cpu ?? 0));
//       const memPercent = Math.round(Number(payload.memory ?? 0));
//       const diskPercent = Math.round(Number(payload.disk ?? 0));

//       return {
//         ...prev,
//         [targetId]: {
//           ...existing,
//           serverId: targetId,
//           serverName: existing.serverName || targetId,
//           ipAddress: payload.ipAddress || existing.ipAddress || '172.31.4.225',
//           uptime: payload.timestamp ? new Date(payload.timestamp).toLocaleTimeString() : 'LIVE',
//           status: cpuLoad > 85 || memPercent > 90 ? 'warning' : 'healthy',

//           // CPU
//           cpuTotal: cpuLoad,
//           cpuCores: payload.cpuCores && payload.cpuCores.length > 0 ? payload.cpuCores : [cpuLoad],

//           // Memory
//           memory: {
//             totalGiB: payload.memoryTotal || existing.memory?.totalGiB || 8.0,
//             usedGiB: Number((((payload.memoryTotal || 8.0) * memPercent) / 100).toFixed(1)),
//             percent: memPercent,
//             swapUsedGiB: 0,
//           },

//           // Disks
//           disks: payload.disks && payload.disks.length > 0 ? payload.disks : [
//             {
//               name: '/ (root)',
//               usedGiB: Number(((30.0 * diskPercent) / 100).toFixed(1)),
//               totalGiB: 30.0,
//               percent: diskPercent,
//             },
//           ],

//           // Network
//           network: payload.network && payload.network.length > 0 ? payload.network : [
//             {
//               name: 'eth0',
//               download: payload.download || 'Active',
//               upload: payload.upload || 'Active',
//             },
//           ],
//         },
//       };
//     });

//     // Auto switch active server if none set
//     setActiveServerId((current) => current || targetId);
//   }, []);

//   useSocket({ onMessage: handleSocketMessage });

//   const currentServer = servers[activeServerId] || Object.values(servers)[0];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-6 flex items-center justify-center">
//         <span className="animate-pulse text-cyan-400">LOADING REGISTERED NODES FROM SUPABASE...</span>
//       </div>
//     );
//   }

//   if (!currentServer) {
//     return (
//       <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-6 flex flex-col items-center justify-center space-y-4">
//         <span className="text-yellow-400 font-bold">NO ACTIVE SERVERS LINKED TO THIS ACCOUNT</span>
//         <p className="text-xs text-gray-500">Click below to onboard a target machine using the setup script.</p>
//         <AddServerModal />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-4 select-none">
//       {/* Top Header Bar */}
//       <div className="border border-gray-800 bg-[#0b0c10] px-4 py-2 flex flex-wrap justify-between items-center text-xs text-gray-400 mb-3 gap-2">
//         <div className="flex items-center gap-2 text-cyan-400 font-bold">
//           <Terminal className="w-4 h-4 animate-pulse" />
//           <span>VORTEX-TUI v2.0 // MULTI-NODE OBSERVER</span>
//         </div>

//         <div className="flex items-center gap-4">
//           <div>SYS_UPTIME: {currentServer.uptime || 'N/A'}</div>
//           <div className="flex items-center gap-2 font-bold">
//             {currentServer.status === 'healthy' ? (
//               <span className="text-emerald-400 flex items-center gap-1">
//                 <ShieldCheck className="w-3.5 h-3.5" /> NOMINAL
//               </span>
//             ) : (
//               <span className="text-amber-400 flex items-center gap-1">
//                 <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> ATTENTION REQUIRED
//               </span>
//             )}
//           </div>
//           <AddServerModal />
//         </div>
//       </div>

//       {/* Node Selector Bar */}
//       <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 border-b border-gray-900">
//         <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-2">
//           <Server className="w-3.5 h-3.5 text-cyan-400" /> CLUSTER NODES ({Object.keys(servers).length}):
//         </span>
//         {Object.values(servers).map((srv) => (
//           <button
//             key={srv.serverId}
//             onClick={() => setActiveServerId(srv.serverId)}
//             className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 border ${
//               activeServerId === srv.serverId
//                 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950'
//                 : 'bg-[#0b0c10] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
//             }`}
//           >
//             <span className={`w-2 h-2 rounded-full ${srv.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
//             {srv.serverName}
//             <span className="text-[10px] opacity-60 font-mono">({srv.serverId})</span>
//           </button>
//         ))}
//       </div>

//       {/* Grid Layout */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         {/* CPU */}
//         <div className="border border-cyan-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
//           <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-cyan-400 font-bold flex items-center gap-1">
//             <Cpu className="w-3 h-3" /> 1. CPU PROCESSOR ({currentServer.cpuCores?.length || 1} CORES)
//           </span>

//           <div className="space-y-2 mt-1">
//             <div className="flex justify-between text-xs">
//               <span>TOTAL LOAD</span>
//               <span className="text-cyan-400 font-bold">{currentServer.cpuTotal || 0}%</span>
//             </div>
//             <AsciiBar percent={currentServer.cpuTotal || 0} color={currentServer.cpuTotal > 80 ? 'text-red-500' : 'text-cyan-400'} />

//             <div className="pt-3 border-t border-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto custom-scrollbar">
//               {currentServer.cpuCores?.map((val, idx) => (
//                 <div key={idx} className="flex justify-between items-center text-gray-400 bg-black/40 px-2 py-1 rounded">
//                   <span>Core {idx}:</span>
//                   <div className="flex items-center gap-2">
//                     <AsciiBar percent={val} color={val > 85 ? 'text-red-400' : 'text-emerald-400'} />
//                     <span className="w-7 text-right font-bold text-gray-300">{val}%</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Memory */}
//         <div className="border border-purple-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
//           <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-purple-400 font-bold flex items-center gap-1">
//             <Layers className="w-3 h-3" /> 2. MEMORY
//           </span>

//           <div className="space-y-3 mt-1 text-xs">
//             <div className="flex justify-between">
//               <span className="text-gray-400">Capacity:</span>
//               <span className="text-white font-bold">{currentServer.memory?.totalGiB || 0} GiB</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">Active Used:</span>
//               <span className="text-purple-400 font-bold">
//                 {currentServer.memory?.usedGiB || 0} GiB ({currentServer.memory?.percent || 0}%)
//               </span>
//             </div>
//             <AsciiBar percent={currentServer.memory?.percent || 0} color={currentServer.memory?.percent > 90 ? 'text-red-500' : 'text-purple-400'} />

//             <div className="pt-2 text-[10px] text-gray-500 flex justify-between border-t border-gray-900">
//               <span>SWAP USED: {currentServer.memory?.swapUsedGiB || 0} GiB</span>
//               <span>FREE: {((currentServer.memory?.totalGiB || 0) - (currentServer.memory?.usedGiB || 0)).toFixed(1)} GiB</span>
//             </div>
//           </div>
//         </div>

//         {/* Disks */}
//         <div className="border border-emerald-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
//           <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
//             <HardDrive className="w-3 h-3" /> 3. STORAGE PARTITIONS ({currentServer.disks?.length || 1})
//           </span>

//           <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
//             {currentServer.disks?.map((disk, idx) => (
//               <div key={idx} className="space-y-1 bg-black/30 p-2 rounded border border-gray-900">
//                 <div className="flex justify-between text-gray-300">
//                   <span className="font-bold text-white">{disk.name}</span>
//                   <span className="text-emerald-400 font-bold">{disk.percent}%</span>
//                 </div>
//                 <AsciiBar percent={disk.percent} color={disk.percent > 85 ? 'text-red-400' : 'text-emerald-400'} />
//                 <div className="flex justify-between text-[10px] text-gray-500">
//                   <span>Free: {(disk.totalGiB - disk.usedGiB).toFixed(1)} GiB</span>
//                   <span>Used: {disk.usedGiB} / {disk.totalGiB} GiB</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Network */}
//         <div className="border border-blue-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
//           <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-blue-400 font-bold flex items-center gap-1">
//             <Wifi className="w-3 h-3" /> 4. NETWORK INTERFACES ({currentServer.network?.length || 1})
//           </span>

//           <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
//             {currentServer.network?.map((net, idx) => (
//               <div key={idx} className="p-2 border border-gray-900 bg-black/50 rounded space-y-1.5">
//                 <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{net.name}</div>
//                 <div className="flex justify-between text-gray-300">
//                   <span>▼ DOWNLOAD:</span>
//                   <span className="text-blue-400 font-bold font-mono">{net.download}</span>
//                 </div>
//                 <div className="flex justify-between text-gray-300">
//                   <span>▲ UPLOAD:</span>
//                   <span className="text-purple-400 font-bold font-mono">{net.upload}</span>
//                 </div>
//               </div>
//             ))}

//             <div className="text-[10px] text-gray-600 font-mono text-center pt-1 border-t border-gray-900">
//               IP: {currentServer.ipAddress || 'N/A'} // STATUS: ACTIVE
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TerminalDashboard;