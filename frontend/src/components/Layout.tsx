import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Activity, Shield } from 'lucide-react';

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
    <div className="min-h-screen grid-bg" style={{ background: 'var(--bg-base)' }}>
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'rgba(7,11,20,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'var(--accent-glow)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>
              PulseOps
            </span>
            <span className="text-xs ml-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
              monitor
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all"
            style={{
              background: location.pathname === '/dashboard' ? 'var(--accent-glow)' : 'transparent',
              color: location.pathname === '/dashboard' ? 'var(--accent)' : 'var(--text-secondary)',
              border: location.pathname === '/dashboard' ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
            }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'pulse-dot' : ''}`}
              style={{ background: connected ? 'var(--healthy)' : 'var(--critical)' }}
            />
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="w-px h-4" style={{ background: 'var(--border)' }} />

          {/* Shield icon */}
          <Shield className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
