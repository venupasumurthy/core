'use client';
import { useState } from 'react';
import type { PlatformRobot, RobotRole } from '@/types/platform';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateRobot: (robot: PlatformRobot) => void;
  nextIdNumber: number;
}

const ROLES: { role: RobotRole; label: string; desc: string; icon: string; defaultSpeed: number; defaultCap: number }[] = [
  { role: 'WATER_COLLECTOR', label: 'Water Collector', desc: 'Collects & purifies industrial waste water', icon: '💧', defaultSpeed: 3.8, defaultCap: 80 },
  { role: 'PLANTER', label: 'Arborist / Planter', desc: 'Consumes water to plant trees & vegetation', icon: '🌱', defaultSpeed: 3.2, defaultCap: 60 },
  { role: 'TRANSPORTER', label: 'Transport AGV', desc: 'Ferries resources between dependent robots', icon: '🚚', defaultSpeed: 5.0, defaultCap: 120 },
  { role: 'CLEANER', label: 'Facility Cleaner', desc: 'Sweeps & sanitizes hazardous corridors', icon: '🧹', defaultSpeed: 4.2, defaultCap: 50 },
  { role: 'HEAVY_LIFTER', label: 'Heavy Lifter', desc: 'Transfers heavy industrial components', icon: '🏗️', defaultSpeed: 2.2, defaultCap: 200 },
  { role: 'GENERAL', label: 'General Utility', desc: 'Flexible multipurpose support unit', icon: '🤖', defaultSpeed: 3.5, defaultCap: 75 },
];

export default function CreateRobotModal({ isOpen, onClose, onCreateRobot, nextIdNumber }: Props) {
  const [selectedRole, setSelectedRole] = useState<RobotRole>('WATER_COLLECTOR');
  const [name, setName] = useState(`Bot-Aqua-${nextIdNumber}`);
  const [battery, setBattery] = useState(100);
  const [health, setHealth] = useState(100);
  const [speed, setSpeed] = useState(3.8);
  const [capacity, setCapacity] = useState(80);

  if (!isOpen) return null;

  const handleRoleChange = (role: RobotRole) => {
    setSelectedRole(role);
    const def = ROLES.find(r => r.role === role);
    if (def) {
      setSpeed(def.defaultSpeed);
      setCapacity(def.defaultCap);
      const prefix = role.split('_')[0];
      setName(`Bot-${prefix.charAt(0) + prefix.slice(1).toLowerCase()}-${nextIdNumber}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRobot: PlatformRobot = {
      id: `R${String(nextIdNumber).padStart(4, '0')}`,
      name: name || `Robot-${nextIdNumber}`,
      role: selectedRole,
      battery,
      health,
      speed,
      capacity,
      currentLoad: 0,
      state: 'IDLE',
      x: 60 + Math.random() * 40,
      y: 60 + Math.random() * 40,
      workProgress: 0,
      workTimeRemaining: 0,
    };
    onCreateRobot(newRobot);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass glow"
        style={{
          width: '100%',
          maxWidth: 580,
          padding: '32px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>
              🤖 Commission New Robot
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Configure robot telemetry, specialized roles, and physical stats
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
              Robot Call-Sign / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>
              Select Operational Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {ROLES.map(r => (
                <div
                  key={r.role}
                  onClick={() => handleRoleChange(r.role)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: selectedRole === r.role ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${selectedRole === r.role ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 20 }}>{r.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedRole === r.role ? '#c7d2fe' : '#e2e8f0', marginTop: 4 }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>
                    {r.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Battery Initial:</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>{battery}%</span>
              </div>
              <input type="range" min={30} max={100} value={battery} onChange={e => setBattery(+e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Health Initial:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{health}%</span>
              </div>
              <input type="range" min={50} max={100} value={health} onChange={e => setHealth(+e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Speed:</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{speed.toFixed(1)} u/s</span>
              </div>
              <input type="range" min={1} max={6} step={0.2} value={speed} onChange={e => setSpeed(+e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Payload Capacity:</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{capacity} kg/L</span>
              </div>
              <input type="range" min={20} max={250} step={10} value={capacity} onChange={e => setCapacity(+e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              🚀 Deploy Robot to Fleet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
