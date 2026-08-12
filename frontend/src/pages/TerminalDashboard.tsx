import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Cpu, HardDrive, Layers, Wifi, Terminal, Server, ShieldCheck, ShieldAlert } from 'lucide-react';
import { AddServerModal } from '../components/AddServerModal';

// Flexible Data Interfaces
export interface NetworkInterface {
  name: string;
  download: string;
  upload: string;
}

export interface DiskPartition {
  name: string;      // e.g., "/", "/mnt/backup", or "C:"
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
  cpuCores: number[];             // Dynamic array: e.g., [12, 45, 88, 23, 90, 11]
  memory: {
    usedGiB: number;
    totalGiB: number;
    percent: number;
    swapUsedGiB: number;
  };
  disks: DiskPartition[];          // Dynamic array of partitions
  network: NetworkInterface[];     // Dynamic array of interfaces (eth0, wlan0, docker0)
}

// Custom ASCII Progress Bar
const AsciiBar = ({ percent, color = 'text-[#45f3ff]' }: { percent: number; color?: string }) => {
  const totalBlocks = 16;
  const filledBlocks = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  return <span className={`font-mono font-bold ${color}`}>{bar}</span>;
};

const TerminalDashboard = () => {
  // Map of active servers keyed by serverId
  const [servers, setServers] = useState<Record<string, DynamicServerMetrics>>({
    'node-01': {
      serverId: 'node-01',
      serverName: 'api-gateway-us-east',
      ipAddress: '192.168.1.10',
      uptime: '14d 02:11',
      status: 'healthy',
      cpuTotal: 42,
      cpuCores: [35, 50, 41, 42],
      memory: { usedGiB: 6.2, totalGiB: 16.0, percent: 38.7, swapUsedGiB: 0.1 },
      disks: [
        { name: '/ (root)', usedGiB: 45, totalGiB: 100, percent: 45 },
        { name: '/var/log', usedGiB: 12, totalGiB: 20, percent: 60 }
      ],
      network: [
        { name: 'eth0', download: '1.2 MiB/s', upload: '340 KiB/s' }
      ]
    },
    'node-02': {
      serverId: 'node-02',
      serverName: 'db-primary-main',
      ipAddress: '192.168.1.25',
      uptime: '45d 18:40',
      status: 'warning',
      cpuTotal: 88,
      cpuCores: [92, 85, 90, 84, 88, 89, 91, 85], // 8 Cores!
      memory: { usedGiB: 28.4, totalGiB: 32.0, percent: 88.7, swapUsedGiB: 2.4 },
      disks: [
        { name: '/', usedGiB: 80, totalGiB: 100, percent: 80 },
        { name: '/var/lib/postgresql', usedGiB: 450, totalGiB: 500, percent: 90 },
        { name: '/mnt/backups', usedGiB: 120, totalGiB: 1000, percent: 12 }
      ],
      network: [
        { name: 'eth0 (Public)', download: '14.2 MiB/s', upload: '8.1 MiB/s' },
        { name: 'eth1 (Internal)', download: '45.0 MiB/s', upload: '42.1 MiB/s' }
      ]
    }
  });

  const [activeServerId, setActiveServerId] = useState<string>('node-01');

  // Listen to WebSocket payloads and dynamically merge/update state
  useSocket((payload: any) => {
    if (!payload?.serverId) return;

    setServers((prev) => {
      const existing = prev[payload.serverId] || {};
      return {
        ...prev,
        [payload.serverId]: {
          ...existing,
          ...payload,
          // Safely fallback to incoming dynamic arrays or empty lists
          cpuCores: payload.cpuCores || existing.cpuCores || [],
          disks: payload.disks || existing.disks || [],
          network: payload.network || existing.network || []
        }
      };
    });
  });

  const currentServer = servers[activeServerId] || Object.values(servers)[0];

  if (!currentServer) {
    return (
      <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-6 flex items-center justify-center">
        <span className="animate-pulse text-cyan-400">WAITING FOR SERVER TELEMETRY STREAMS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#c5c6c7] font-mono p-4 select-none">
      
      {/* 1. Top Header Bar */}
      <div className="border border-gray-800 bg-[#0b0c10] px-4 py-2 flex flex-wrap justify-between items-center text-xs text-gray-400 mb-3 gap-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span>VORTEX-TUI v2.0 // MULTI-NODE OBSERVER</span>
        </div>

        <div className="flex items-center gap-4">
        <div>SYS_UPTIME: {currentServer.uptime}</div>
        <div className="flex items-center gap-2 font-bold">
          {currentServer.status === 'healthy' ? (
            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> NOMINAL</span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> ATTENTION REQUIRED
            </span>
          )}
        </div>
        <AddServerModal />
      </div>
      </div>

      {/* 2. Multi-Server Node Selector Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 border-b border-gray-900">
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-2">
          <Server className="w-3.5 h-3.5 text-cyan-400" /> CLUSTER NODES:
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

      {/* 3. Dynamic Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Box 1: Dynamic CPU & Cores */}
        <div className="border border-cyan-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-cyan-400 font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3" /> 1. CPU PROCESSOR ({currentServer.cpuCores.length} CORES)
          </span>

          <div className="space-y-2 mt-1">
            <div className="flex justify-between text-xs">
              <span>TOTAL LOAD</span>
              <span className="text-cyan-400 font-bold">{currentServer.cpuTotal}%</span>
            </div>
            <AsciiBar percent={currentServer.cpuTotal} color={currentServer.cpuTotal > 80 ? 'text-red-500' : 'text-cyan-400'} />

            {/* Render dynamic cores grid */}
            <div className="pt-3 border-t border-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto custom-scrollbar">
              {currentServer.cpuCores.map((val, idx) => (
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

        {/* Box 2: Memory (RAM) */}
        <div className="border border-purple-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-purple-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> 2. MEMORY
          </span>

          <div className="space-y-3 mt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white font-bold">{currentServer.memory.totalGiB} GiB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Used:</span>
              <span className="text-purple-400 font-bold">
                {currentServer.memory.usedGiB} GiB ({currentServer.memory.percent}%)
              </span>
            </div>
            <AsciiBar percent={currentServer.memory.percent} color={currentServer.memory.percent > 90 ? 'text-red-500' : 'text-purple-400'} />
            
            <div className="pt-2 text-[10px] text-gray-500 flex justify-between border-t border-gray-900">
              <span>SWAP USED: {currentServer.memory.swapUsedGiB} GiB</span>
              <span>FREE: {(currentServer.memory.totalGiB - currentServer.memory.usedGiB).toFixed(1)} GiB</span>
            </div>
          </div>
        </div>

        {/* Box 3: Dynamic Disks Array */}
        <div className="border border-emerald-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> 3. STORAGE PARTITIONS ({currentServer.disks.length})
          </span>

          <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
            {currentServer.disks.map((disk, idx) => (
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

        {/* Box 4: Dynamic Network Interfaces */}
        <div className="border border-blue-900/50 bg-[#0b0c10] p-4 rounded-sm relative">
          <span className="absolute -top-2.5 left-3 bg-black px-2 text-xs text-blue-400 font-bold flex items-center gap-1">
            <Wifi className="w-3 h-3" /> 4. NETWORK INTERFACES ({currentServer.network.length})
          </span>

          <div className="space-y-3 mt-1 text-xs max-h-52 overflow-y-auto custom-scrollbar">
            {currentServer.network.map((net, idx) => (
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
              IP: {currentServer.ipAddress} // STATUS: ACTIVE
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TerminalDashboard;