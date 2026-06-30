import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Terminal, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access Denied: Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2833]/40 border border-gray-800 rounded-xl p-8 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 bg-cyan-950/40 border border-cyan-800 rounded-xl text-[#45f3ff]">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white">VORTEX CONSOLE</h1>
          <p className="text-xs text-gray-500 tracking-wider">SECURE TELEMETRY INTERFACE</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-lg text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Operator Identity</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@vortex.internal"
              className="w-full bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#45f3ff] transition duration-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Access Key Override</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#45f3ff] transition duration-200 text-sm"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-semibold tracking-wider text-white py-3 rounded-lg shadow-lg shadow-cyan-950/40 active:scale-[0.99] transition duration-150 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING CORRIDOR...' : 'ESTABLISH CONNECT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;