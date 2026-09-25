'use client';
import { useState } from 'react';
import type { SimAction } from '@/types/simulation';

interface Props {
  running: boolean;
  connected: boolean;
  send: (a: SimAction) => void;
  onWorldSizeChange: (ws: number) => void;
}

function Row({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
      />
    </div>
  );
}

export default function SimControls({ running, connected, send, onWorldSizeChange }: Props) {
  const [nRobots, setNRobots] = useState(40);
  const [nTasks,  setNTasks]  = useState(25);
  const [ws,      setWs]      = useState(500);

  const handleReset = () => {
    onWorldSizeChange(ws);
    send({ action: 'reset', n_robots: nRobots, n_tasks: nTasks, world_size: ws });
  };

  const applyPreset = (r: number, t: number, w: number) => {
    setNRobots(r);
    setNTasks(t);
    setWs(w);
    onWorldSizeChange(w);
    send({ action: 'reset', n_robots: r, n_tasks: t, world_size: w });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Connection banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
        background: connected ? 'rgba(76,175,80,0.09)' : 'rgba(229,57,53,0.09)',
        border: '1px solid ' + (connected ? 'rgba(76,175,80,0.28)' : 'rgba(229,57,53,0.28)'),
      }}>
        <span className={connected ? 'live-dot' : ''} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: connected ? '#4caf50' : '#e53935', display: 'inline-block',
        }} />
        <span style={{ fontSize: 12, color: connected ? '#4caf50' : '#e53935', fontWeight: 600 }}>
          {connected ? 'Backend Connected' : 'Connecting to backend...'}
        </span>
      </div>

      {/* Playback */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 10 }}>
          PLAYBACK
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
          <button className="btn btn-primary" onClick={() => send({ action: 'resume' })} disabled={!connected || running}>
            ▶ Play
          </button>
          <button className="btn btn-ghost" onClick={() => send({ action: 'pause' })} disabled={!connected || !running}>
            ⏸ Pause
          </button>
        </div>
        <button className="btn btn-ghost" onClick={() => send({ action: 'step', ticks: 5 })} disabled={!connected}>
          ⏭ Step (5 ticks)
        </button>
      </div>

      {/* Fleet Scale Presets */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 8 }}>
          SCALE PRESETS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '6px 4px' }}
            disabled={!connected}
            onClick={() => applyPreset(40, 25, 500)}
          >
            40 Robots
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '6px 4px' }}
            disabled={!connected}
            onClick={() => applyPreset(100, 60, 800)}
          >
            100 Dense
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '6px 4px', border: '1px solid #6366f1', color: '#a5b4fc' }}
            disabled={!connected}
            onClick={() => applyPreset(500, 250, 1800)}
          >
            500 Mega
          </button>
        </div>
      </div>

      {/* Config sliders */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 12 }}>
          CUSTOM CONFIG
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="Robots"    value={nRobots} onChange={setNRobots} min={5}   max={500}  step={5}   />
          <Row label="Tasks"     value={nTasks}  onChange={setNTasks}  min={5}   max={300}  step={5}   />
          <Row label="World Size" value={ws}     onChange={setWs}      min={200} max={3000} step={100} />
          <button className="btn btn-primary" onClick={handleReset} disabled={!connected}>
            🔄 Reset Custom Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
