import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import type { ServerStatus } from '../types';
import { Cpu, HardDrive, Layers, Activity } from 'lucide-react';

interface ServerCardProps {
  server: ServerStatus;
}

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const navigate = useNavigate();
  const latest = server.history[server.history.length - 1] || { cpu: 0, memory: 0, disk: 0 };

  const statusColors = {
    healthy: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    critical: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse',
  };

  const MiniSparkline = ({ dataKey, color }: { dataKey: 'cpu' | 'memory' | 'disk'; color: string }) => (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={server.history}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div 
      onClick={() => navigate(`/dashboard/${server.id}`)}
      className="bg-[#1f2833]/20 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 hover:bg-[#1f2833]/40 transition duration-200 group flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-white font-semibold text-lg tracking-wide group-hover:text-[#45f3ff] transition">
              {server.name}
            </h3>
            <span className="text-xs text-gray-500 font-mono">{server.id}</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider border font-semibold ${statusColors[server.status]}`}>
            {server.status}
          </span>
        </div>

        {/* Dynamic Metric Rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-400">Processor</span>
            </div>
            <div className="flex items-center gap-4">
              <MiniSparkline dataKey="cpu" color="#06b6d4" />
              <span className="font-mono text-sm font-semibold text-white w-12 text-right">{latest.cpu.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Memory</span>
            </div>
            <div className="flex items-center gap-4">
              <MiniSparkline dataKey="memory" color="#a855f7" />
              <span className="font-mono text-sm font-semibold text-white w-12 text-right">{latest.memory.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">Storage</span>
            </div>
            <div className="flex items-center gap-4">
              <MiniSparkline dataKey="disk" color="#10b981" />
              <span className="font-mono text-sm font-semibold text-white w-12 text-right">{latest.disk.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-gray-600" /> Telemetry Active
        </span>
        <span className="font-mono">
          {server.history.length > 0 ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
        </span>
      </div>
    </div>
  );
};

export default ServerCard;