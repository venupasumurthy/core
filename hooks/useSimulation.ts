'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimAction, SimSnapshot } from '@/types/simulation';
import { SimulationEngine } from '@/lib/simulation/SimulationEngine';

const WS_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000')
    : 'ws://localhost:8000';

export function useSimulation() {
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(40, 25, 500);
  }

  const [snapshot, setSnapshot] = useState<SimSnapshot>(() => engineRef.current!.getSnapshot());
  const [connected, setConnected] = useState(true);
  const [isExternalWs, setIsExternalWs] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Sync snapshot helper
  const syncSnapshot = useCallback(() => {
    if (engineRef.current) {
      setSnapshot(engineRef.current.getSnapshot());
    }
  }, []);

  const send = useCallback((action: SimAction) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Execute directly in real simulation engine
    switch (action.action) {
      case 'reset':
        engine.init(action.n_robots, action.n_tasks, action.world_size);
        break;
      case 'resume':
        engine.running = true;
        break;
      case 'pause':
        engine.running = false;
        break;
      case 'step':
        for (let i = 0; i < action.ticks; i++) {
          engine.step();
        }
        break;
      case 'inject_failure':
        engine.injectRobotFailure(action.robot_id);
        break;
      case 'inject_comm_loss':
        engine.injectCommLoss(action.robot_id);
        break;
      case 'inject_low_battery':
        engine.injectLowBattery(action.robot_id);
        break;
      case 'inject_corridor_block':
        engine.injectCorridorBlock(action.obstacle_id);
        break;
      case 'inject_charger_failure':
        engine.injectChargerFailure(action.station_id);
        break;
      case 'inject_task_surge':
        engine.injectTaskSurge(action.count ?? 15);
        break;
      case 'inject_deadlock':
        engine.injectDeadlock();
        break;
      case 'inject_emergency_task':
        engine.injectEmergencyTask();
        break;
      case 'inject_controller_failure':
        engine.killCentralController();
        break;
      case 'restore_controller':
        engine.restoreCentralController();
        break;
      case 'toggle_controller':
        engine.toggleController();
        break;
      case 'restore_all':
        engine.restoreAll();
        break;
      case 'break_the_fleet':
        engine.breakTheFleet();
        break;
      case 'set_info_quality':
        engine.setInfoQuality(action.quality);
        break;
      case 'run_what_if':
        engine.runWhatIfScenario(action.scenario);
        break;
      case 'start_jury_demo':
        engine.startJuryDemo();
        break;
      case 'step_jury_demo':
        engine.stepJuryDemo();
        break;
      case 'stop_jury_demo':
        engine.stopJuryDemo();
        break;
    }

    syncSnapshot();

    // Also forward to WebSocket if active
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, [syncSnapshot]);

  // Main Simulation Loop (runs when engine.running is true)
  useEffect(() => {
    let animId: number;
    let lastTickTime = performance.now();

    const loop = (now: number) => {
      const engine = engineRef.current;
      if (engine && engine.running) {
        // Run tick at ~3.5 ticks per second for clear visual comprehension
        if (now - lastTickTime > 280) {
          engine.step();
          syncSnapshot();
          lastTickTime = now;
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [syncSnapshot]);

  // Optional External WebSocket Listener
  useEffect(() => {
    let destroyed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function tryConnect() {
      if (destroyed) return;
      try {
        const ws = new WebSocket(WS_BASE + '/ws/simulation');
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setIsExternalWs(true);
        };

        ws.onmessage = e => {
          try {
            const externalSnap = JSON.parse(e.data as string) as SimSnapshot;
            if (externalSnap && externalSnap.robots) {
              setSnapshot(externalSnap);
            }
          } catch {
            // Ignore malformed
          }
        };

        ws.onclose = () => {
          setIsExternalWs(false);
          // Keep connected = true because local engine is seamlessly active!
          setConnected(true);
          if (!destroyed) {
            reconnectTimeout = setTimeout(tryConnect, 6000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setIsExternalWs(false);
        setConnected(true);
      }
    }

    tryConnect();

    return () => {
      destroyed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);

  return {
    snapshot,
    connected,
    isExternalWs,
    send,
    historySnapshots: engineRef.current?.historySnapshots ?? [],
  };
}
