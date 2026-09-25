'use client';
import { useState } from 'react';
import type { WorkZone, ZoneTaskType } from '@/types/platform';

interface Props {
  isOpen: boolean;
  zoneDraft: { x: number; y: number; width: number; height: number } | null;
  onClose: () => void;
  onCreateZone: (zone: WorkZone) => void;
  nextZoneNumber: number;
}

const TASK_PRESETS: {
  type: ZoneTaskType;
  label: string;
  defaultName: string;
  defaultTime: number;
  color: string;
  resourceReq?: { type: string; amount: number };
  resourceProd?: { type: string; amount: number };
}[] = [
  {
    type: 'WATER_WASTE',
    label: '💧 Water Synthesis (Produces Purified Water)',
    defaultName: 'Hydro Synthesis Sector',
    defaultTime: 45,
    color: '#0284c7',
    resourceProd: { type: 'Purified Water', amount: 500 },
  },
  {
    type: 'INSPECTION',
    label: '⛏️ Mineral Ore Extraction (Produces Raw Silicon / Ore)',
    defaultName: 'Mineral Extraction Cavern',
    defaultTime: 50,
    color: '#a855f7',
    resourceProd: { type: 'Mineral Ore / Silicon', amount: 350 },
  },
  {
    type: 'TREE_PLANTING',
    label: '🌱 Agri Bio-Nutrient Cultivation (Requires Purified Water)',
    defaultName: 'Agri Cultivation Greenery',
    defaultTime: 60,
    color: '#16a34a',
    resourceReq: { type: 'Purified Water', amount: 500 },
  },
  {
    type: 'CLEANING',
    label: '⚡ Power Cell Charging & Storage (Produces Power Cells)',
    defaultName: 'Energy Depot & Capacitor Vault',
    defaultTime: 40,
    color: '#f59e0b',
    resourceProd: { type: 'Charged Power Cells', amount: 150 },
  },
  {
    type: 'DELIVERY',
    label: '📦 Component Assembly Logistics (Requires Mineral Ore)',
    defaultName: 'Robotic Fabrication Bay',
    defaultTime: 35,
    color: '#ef4444',
    resourceReq: { type: 'Mineral Ore / Silicon', amount: 200 },
  },
];

export default function ZoneFormModal({
  isOpen,
  zoneDraft,
  onClose,
  onCreateZone,
  nextZoneNumber,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<ZoneTaskType>('WATER_WASTE');
  const [name, setName] = useState(`Zone ${nextZoneNumber} - Water Treatment`);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [timeLimit, setTimeLimit] = useState(45);
  const [resourceAmount, setResourceAmount] = useState(500);

  if (!isOpen || !zoneDraft) return null;

  const handleTaskChange = (type: ZoneTaskType) => {
    setSelectedTask(type);
    const preset = TASK_PRESETS.find(p => p.type === type);
    if (preset) {
      setName(`Zone ${nextZoneNumber} - ${preset.defaultName}`);
      setTimeLimit(preset.defaultTime);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preset = TASK_PRESETS.find(p => p.type === selectedTask) || TASK_PRESETS[0];

    const newZone: WorkZone = {
      id: `Z${String(nextZoneNumber).padStart(3, '0')}`,
      name: name || `Zone ${nextZoneNumber}`,
      x: zoneDraft.x,
      y: zoneDraft.y,
      width: Math.max(70, zoneDraft.width),
      height: Math.max(70, zoneDraft.height),
      color: preset.color,
      taskType: selectedTask,
      difficulty,
      timeLimitSeconds: timeLimit,
      timeRemainingSeconds: timeLimit,
      resourceRequired: preset.resourceReq ? { ...preset.resourceReq, amount: resourceAmount } : undefined,
      resourceProduced: preset.resourceProd ? { ...preset.resourceProd, amount: resourceAmount } : undefined,
      currentResourceLevel: preset.type === 'WATER_WASTE' ? 0 : 0,
      status: 'UNASSIGNED',
      assignedRobotId: null,
    };

    onCreateZone(newZone);
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
          maxWidth: 540,
          padding: '30px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#f8fafc' }}>
              📐 Configure Work Zone
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Define work order specifications, difficulty, and resource quotas
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Zone Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
              Zone Identifier / Name
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

          {/* Task Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
              Operational Task Type
            </label>
            <select
              value={selectedTask}
              onChange={e => handleTaskChange(e.target.value as ZoneTaskType)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {TASK_PRESETS.map(p => (
                <option key={p.type} value={p.type}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty / Hardness */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
              Task Hardness (affects robot drain rate)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['EASY', 'MEDIUM', 'HARD'] as const).map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    padding: '8px',
                    borderRadius: 8,
                    border: `1px solid ${difficulty === d ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    background: difficulty === d ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                    color: difficulty === d ? '#a5b4fc' : '#94a3b8',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {d === 'EASY' ? '🟢 Easy' : d === 'MEDIUM' ? '🟡 Medium' : '🔴 Hard'}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline / Time Limit & Resource Quota */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Deadline Limit:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{timeLimit}s</span>
              </div>
              <input type="range" min={15} max={120} step={5} value={timeLimit} onChange={e => setTimeLimit(+e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Resource Quota:</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{resourceAmount} L/kg</span>
              </div>
              <input type="range" min={100} max={1000} step={50} value={resourceAmount} onChange={e => setResourceAmount(+e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              ✓ Save & Create Work Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
