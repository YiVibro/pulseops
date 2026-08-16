import React, { useState } from 'react';
import axios from 'axios';
import { Copy, Check, Plus, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Base backend URL without trailing slash or /api
const BASE_URL = (import.meta.env.VITE_API_URL || 'https://api.pulseops.yivibro.in').replace(/\/api\/?$/, '').replace(/\/$/, '');

export const AddServerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateInstallerCommand = async () => {
    setLoading(true);
    try {
      // 1. Get active session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to onboard a server.');
      }

      const token = session.access_token;
      const userId = session.user.id;

      // 2. Request setup token with Supabase JWT & userId
      const res = await axios.post(
        `${BASE_URL}/api/token/generate-setup-token`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data?.command) {
        setCommand(res.data.command);
      } else {
        setCommand(`curl -sSL ${BASE_URL}/install.sh | sudo bash -s -- "${res.data.setupToken}" "${BASE_URL}"`);
      }
      setIsOpen(true);
    } catch (err: any) {
      console.error('Failed to issue setup token:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={generateInstallerCommand}
        disabled={loading}
        className="px-3 py-1.5 bg-cyan-950/80 border border-cyan-500 text-cyan-300 rounded font-mono text-xs font-bold flex items-center gap-2 hover:bg-cyan-900 transition"
      >
        <Plus className="w-3.5 h-3.5" />
        {loading ? 'ISSUING TOKEN...' : 'ONBOARD NEW NODE'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono">
          <div className="bg-[#0b0c10] border border-cyan-800 rounded-lg p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <span className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> DYNAMIC NODE REGISTRATION
              </span>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              Run this single-use command on target server terminal to bind it to your account. Token expires in <span className="text-amber-400 font-bold">15 minutes</span>.
            </p>

            <div className="bg-black border border-gray-800 p-3 rounded flex items-center justify-between text-xs font-mono text-emerald-400 overflow-x-auto">
              <code>{command}</code>
              <button
                onClick={handleCopy}
                className="ml-3 p-1.5 bg-gray-900 border border-gray-700 rounded text-gray-300 hover:text-white transition flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[10px] text-gray-600 flex justify-between pt-2">
              <span>SECURITY PROTOCOL: ONE-TIME HANDSHAKE (TTL: 900s)</span>
              <button onClick={() => setIsOpen(false)} className="underline text-gray-400 hover:text-white">Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};