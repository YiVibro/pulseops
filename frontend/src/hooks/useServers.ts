// import { useState, useEffect } from 'react';
// import { useSocket } from './useSocket'; // Your socket instance

// export interface ServerNode {
//   id: string;
//   name: string;
//   ip?: string;
//   status: 'online' | 'offline';
//   lastSeen?: string;
// }

// const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://18.138.103.202:5000';

// export function useServers() {
//   const [servers, setServers] = useState<ServerNode[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
   
//   const socket = useSocket({
//     onConnect: () => console.log('Connected to Socket.IO server'),
//     onDisconnect: () => console.log('Disconnected from Socket.IO server'),
//   });

//   // 1. Fetch initial registered servers list from DB
//   const fetchServers = async () => {
//     try {
//       const response = await fetch(`${BACKEND_URL}/api/servers`);
//       if (!response.ok) {
//         throw new Error(`Failed to fetch servers: ${response.statusText}`);
//       }
//       const data = await response.json();
//       setServers(data);
//     } catch (err: any) {
//       console.error('[FETCH SERVERS ERROR]:', err);
//       setError(err?.message || 'Error loading servers');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchServers();

//     // 2. Listen for dynamic live metrics stream / new agent connections over Socket.IO
//     socket.current?.on('metrics:live', (payload: any) => {
//       if (!payload || !payload.serverId) return;

//       setServers((prevServers) => {
//         const existingIndex = prevServers.findIndex((s) => s.id === payload.serverId);

//         if (existingIndex !== -1) {
//           // Update status of existing server
//           const updated = [...prevServers];
//           updated[existingIndex] = {
//             ...updated[existingIndex],
//             status: 'online',
//             lastSeen: new Date().toISOString(),
//           };
//           return updated;
//         } else {
//           // Add dynamically registered new agent server to UI in real-time
//           return [
//             ...prevServers,
//             {
//               id: payload.serverId,
//               name: payload.name || payload.serverId,
//               status: 'online',
//               lastSeen: new Date().toISOString(),
//             },
//           ];
//         }
//       });
//     });

//     return () => {
//       socket.current?.off('metrics:live');
//     };
//   }, []);

//   return { servers, loading, error, refreshServers: fetchServers };
// }

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUserServers() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error('[SUPABASE SERVERS FETCH ERROR]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return { servers, loading, refreshServers: fetchServers };
}