import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/terminal` },
        });
        if (error) throw error;
        alert('Account created! Check your email or sign in directly if email confirmation is disabled.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Redirect on successful login!
        if (data.session) {
          navigate('/terminal', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleAuth}
      className="p-8 bg-gray-900/90 border border-gray-800 rounded-xl w-full shadow-2xl backdrop-blur-sm"
    >
      <h2 className="text-xl font-bold mb-6 text-center text-white font-mono">
        {isSignUp ? 'CREATE PULSEOPS ACCOUNT' : 'TERMINAL ACCESS SIGN-IN'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 text-xs font-mono rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-mono mb-1 text-gray-400">EMAIL ADDRESS</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="admin@pulseops.io"
          className="w-full p-2.5 rounded bg-black/60 border border-gray-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      <div className="mb-6">
        <label className="block text-xs font-mono mb-1 text-gray-400">PASSWORD</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full p-2.5 rounded bg-black/60 border border-gray-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs tracking-wider rounded transition disabled:opacity-50"
      >
        {loading ? 'AUTHENTICATING...' : isSignUp ? 'REGISTER NODE OPERATOR' : 'INITIALIZE SESSION'}
      </button>

      <p className="mt-4 text-xs text-center text-gray-400 font-mono">
        {isSignUp ? 'EXISTING OPERATOR?' : 'NEW OPERATOR?'}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-cyan-400 underline hover:text-cyan-300"
        >
          {isSignUp ? 'SIGN IN' : 'REGISTER'}
        </button>
      </p>
    </form>
  );
};