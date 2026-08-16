import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Auth } from '../components/Auth';

export default function Login() {
  const navigate = useNavigate();

  // If user is already logged in, redirect them immediately to /terminal
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/terminal', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 font-mono select-none">
      <div className="w-full max-w-sm">
        {/* Branding Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-3 bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider">PulseOps</h1>
          <p className="text-xs mt-1 text-gray-400">Infrastructure monitoring console</p>
        </div>

        {/* Embedded Auth Form */}
        <Auth />

        <p className="text-center text-[10px] mt-6 font-mono text-gray-600">
          PulseOps v1.0 · Restricted Access · End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}