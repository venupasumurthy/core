'use client';
import type { SimAction } from '@/types/simulation';

interface Props {
  connected: boolean;
  controllerOnline?: boolean;
  send: (a: SimAction) => void;
}

export default function FailureButtons({ connected, controllerOnline = true, send }: Props) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 8 }}>
        FAULT & BLACKOUT INJECTION
      </p>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.55 }}>
        Demonstrates resilient decentralized operation without any central controller.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <button
          className="btn"
          style={{
            background: controllerOnline ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: '1px solid ' + (controllerOnline ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'),
            color: controllerOnline ? '#f87171' : '#4ade80',
          }}
          disabled={!connected}
          onClick={() => send({ action: 'toggle_controller' })}
        >
          {controllerOnline ? '🔌 Kill Central Controller' : '⚡ Restore Central Controller'}
        </button>
        <button className="btn btn-danger" disabled={!connected} onClick={() => send({ action: 'inject_failure' })}>
          💥 Kill Random Robot
        </button>
        <button className="btn btn-warning" disabled={!connected} onClick={() => send({ action: 'inject_comm_loss' })}>
          📡 Cut Robot Comms
        </button>
        <button className="btn btn-success" disabled={!connected} onClick={() => send({ action: 'restore_all' })}>
          ✅ Restore All Systems
        </button>
      </div>
    </div>
  );
}
