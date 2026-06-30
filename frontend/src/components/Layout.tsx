import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';

const Layout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#45f3ff] selection:text-black">
      {/* Structural Global Top Navbar */}
      <nav className="border-b border-gray-800 bg-[#1f2833]/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
          <ShieldAlert className="text-[#45f3ff] w-6 h-6 animate-pulse" />
          <span className="font-bold tracking-wider text-xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VORTEX // OBSERVE
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <LayoutDashboard w-4 h-4 />
            Dashboard
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-950/30 hover:border-red-800 hover:text-red-400 transition duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container Content Slot */}
      <main className="max-w-7xl mx-auto p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;