import { Server, ArrowRight, Cpu, HardDrive, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ServerCard({ server }: { server: any }) {
  const navigate = useNavigate();
  console.log('card data:', server.id, server.history);
  const getStatusColor = (status: string) => {
    if (status === 'healthy') return 'var(--neon-green)';
    if (status === 'warning') return 'var(--neon-yellow)';
    return 'var(--neon-pink)';
  };

  return (
    <div 
      onClick={() => navigate(`/server/${server.id}`)}
      className="cyber-panel rounded p-5 group cursor-pointer transition-all hover:scale-[1.01] text-left"
    >
      {/* Header row tracking node context information parameters */}
      <div className="flex flex-row items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
        <div className="flex flex-row items-center gap-3">
          <Server className="w-4 h-4 text-zinc-400" />
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide uppercase">{server.name || 'Unknown Cluster'}</h3>
            <p className="text-[10px] font-mono text-zinc-500">{server.id || 'id_unassigned'}</p>
          </div>
        </div>
        
        <span 
          className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase"
          style={{ 
            borderColor: getStatusColor(server.status),
            color: getStatusColor(server.status),
            backgroundColor: `${getStatusColor(server.status)}08`
          }}
        >
          {server.status || 'offline'}
        </span>
      </div>

      {/* Row Metrics layout data parsing structures grids */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-900 text-left">
          <div className="flex flex-row items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase mb-1">
            <Cpu className="w-3 h-3 text-[var(--neon-cyan)]" /> CPU
          </div>
          <p className="text-sm font-black text-white">{server.history?.[server.history.length - 1]?.cpu?.toFixed(1) ?? '0.0'}%</p>
        </div>

        <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-900 text-left">
          <div className="flex flex-row items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase mb-1">
            <Layers className="w-3 h-3 text-[var(--neon-pink)]" /> RAM
          </div>
          <p className="text-sm font-black text-white">{server.history?.[server.history.length - 1]?.memory?.toFixed(1) ?? '0.0'}%</p>
        </div>

        <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-900 text-left">
          <div className="flex flex-row items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase mb-1">
            <HardDrive className="w-3 h-3 text-[var(--neon-yellow)]" /> DSK
          </div>
          <p className="text-sm font-black text-white">{server.history?.[server.history.length - 1]?.disk?.toFixed(1) ?? '0.0'}%</p>
        </div>
      </div>

      {/* Row Footer Interaction trigger cues indications */}
      <div className="mt-4 flex flex-row items-center justify-end text-[10px] uppercase font-bold text-zinc-500 group-hover:text-[var(--neon-cyan)] transition-all">
        <span>Inspect Telemetry</span>
        <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}