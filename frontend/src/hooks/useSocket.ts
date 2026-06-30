import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export const useSocket = (onMetricsUpdate?: (data: any) => void, onAlertNew?: (data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Connect to backend websocket endpoint, injecting JWT securely into handshake payload
    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Pipeline established with Vortex socket cluster.');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time infrastructure stream listeners
    if (onMetricsUpdate) {
      socketRef.current.on('metrics:update', onMetricsUpdate);
    }
    if (onAlertNew) {
      socketRef.current.on('alert:new', onAlertNew);
    }

    // Cleanup pipeline connection structure cleanly on unmount lifecycle hook
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onMetricsUpdate, onAlertNew]);

  return { isConnected, socket: socketRef.current };
};