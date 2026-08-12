import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Activity, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  connected?: boolean;
}

export default function Layout({ children, connected = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-mono" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Cyber Navbar Header wrapper block */}
      <nav 
        className="w-full border-b flex flex-row items-center justify-between"
        style={{ borderColor: 'rgba(0, 240, 255, 0.15)', backgroundColor: 'var(--bg-panel)' }}
      >
        {/* Constrains Navbar items to the same horizontal max-width boundary alignment as content below */}
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-row items-center justify-between">
          {/* Brand System Info Left */}
          <div className="flex flex-row items-center gap-3">
            <div className="p-2 rounded border border-[var(--neon-pink)] shadow-[0_0_8px_rgba(255,0,127,0.3)] flex items-center justify-center">
              <Activity className="w-5 h-5" style={{ color: 'var(--neon-pink)' }} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-wider text-white leading-none">
                PULSE<span style={{ color: 'var(--neon-cyan)' }}>OPS</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                NET-MONITOR // SYS_REV_02
              </span>
            </div>
          </div>

          {/* Action Controls Container Right */}
          <div className="flex flex-row items-center gap-6">
            <Link
              to="/dashboard"
              className="flex flex-row items-center gap-2 px-3 py-1.5 border transition-all text-sm uppercase tracking-wider font-bold"
              style={{
                borderColor: location.pathname === '/dashboard' ? 'var(--neon-cyan)' : 'transparent',
                color: location.pathname === '/dashboard' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                boxShadow: location.pathname === '/dashboard' ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'
              }}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <div className="w-px h-4 bg-zinc-800" />

            {/* Network Connection Socket State */}
            <div 
              className="flex flex-row items-center gap-2 px-2.5 py-1 rounded border text-xs font-bold"
              style={{ 
                backgroundColor: 'rgba(10,10,15,0.6)', 
                borderColor: connected ? 'var(--neon-green)' : 'var(--neon-pink)',
                color: connected ? 'var(--neon-green)' : 'var(--neon-pink)',
                boxShadow: connected ? '0 0 8px rgba(57,255,20,0.15)' : '0 0 8px rgba(255,0,127,0.15)'
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }} />
              <span>{connected ? 'SOCKET_LIVE' : 'NET_DISCONNECT'}</span>
            </div>

            <div className="w-px h-4 bg-zinc-800" />

            {/* Destructive Action Trigger */}
            <button
              onClick={handleLogout}
              className="flex flex-row items-center gap-2 px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-[var(--neon-pink)] hover:border-[var(--neon-pink)] transition-all text-sm uppercase tracking-wider font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Kill Session</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Viewport - Added layout padding offsets to squeeze grid layout safe zone inward */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}