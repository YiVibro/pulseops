import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'https://api.pulseops.yivibro.in';

interface UseSocketOptions {
  onMessage?: (data: any) => void;
  onMetric?: (data: any) => void;
  onAlert?: (alert: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      secure: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      optionsRef.current.onConnect?.();
    });

    socket.on('disconnect', () => {
      optionsRef.current.onDisconnect?.();
    });

    socket.on('metrics:update', (data) => {
      optionsRef.current.onMetric?.(data);
      optionsRef.current.onMessage?.(data);
    });

    socket.on('alert:new', (alert) => {
      optionsRef.current.onAlert?.(alert);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}