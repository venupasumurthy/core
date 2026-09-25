'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimAction, SimSnapshot } from '@/types/simulation';

const WS_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000')
    : 'ws://localhost:8000';

export function useSimulation() {
  const [snapshot, setSnapshot] = useState<SimSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((action: SimAction) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(WS_BASE + '/ws/simulation');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Auto-initialise on first connect
        ws.send(JSON.stringify({ action: 'reset', n_robots: 40, n_tasks: 25, world_size: 500 }));
      };
      ws.onclose = () => {
        setConnected(false);
        if (!destroyed) reconnectRef.current = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try { setSnapshot(JSON.parse(e.data as string) as SimSnapshot); }
        catch { /* ignore malformed */ }
      };
    }

    connect();
    return () => {
      destroyed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { snapshot, connected, send };
}
