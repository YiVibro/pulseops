import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useServers() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    try {
      // Supabase RLS enforces "auth.uid() = user_id" automatically!
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch servers');
      console.error('[SUPABASE SERVERS FETCH ERROR]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return { servers, loading, refreshServers: fetchServers, error };
}