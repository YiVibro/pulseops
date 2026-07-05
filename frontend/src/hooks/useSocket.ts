import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { MetricPoint, Alert } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

interface UseSocketOptions {
  onMetric?: (data: { serverId: string } & MetricPoint) => void;
  onAlert?: (alert: Alert) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(WS_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => options.onConnect?.());
    socket.on('disconnect', () => options.onDisconnect?.());
    socket.on('metrics:update', (data) => options.onMetric?.(data));
    socket.on('alert:new', (alert) => options.onAlert?.(alert));

    return () => { socket.disconnect(); };
  }, []);

  return socketRef;
}
