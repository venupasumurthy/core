'use client';
import type { RobotData, SimAction } from '@/types/simulation';

interface Props {
  robot: RobotData | null;
  onClose: () => void;
  send: (a: SimAction) => void;
}

const TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  SCOUT: { label: 'Scout Drone', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  TRANSPORTER: { label: 'Standard AGV', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' },
  HEAVY_LIFTER: { label: 'Heavy Lifter', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

export default function RobotInspector({ robot, onClose, send }: Props) {
  if (!robot) return null;

  const typeInfo = TYPE_BADGES[robot.robot_type ?? 'TRANSPORTER'] ?? TYPE_BADGES.TRANSPORTER;
  const isFailed = robot.state === 'FAILED';
  const isCommDown = robot.comm_active === false;

  return (
    <div
      className="glass"
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px solid rgba(56, 189, 248, 0.3)',
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{robot.id}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              color: typeInfo.color,
              background: typeInfo.bg,
              border: `1px solid ${typeInfo.color}40`,
            }}
          >
            {typeInfo.label}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>

      {/* Battery bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: '#94a3b8' }}>Battery Level</span>
          <span
            style={{
              fontWeight: 700,
              color: robot.battery < 25 ? '#ef4444' : robot.battery < 50 ? '#f59e0b' : '#22c55e',
            }}
          >
            {robot.battery.toFixed(1)}%
          </span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, robot.battery))}%`,
              height: '100%',
              background: robot.battery < 25 ? '#ef4444' : robot.battery < 50 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
        <div className="glass" style={{ padding: '8px 6px', textAlign: 'center', borderRadius: 8 }}>
          <div style={{ color: '#64748b', fontSize: 9 }}>SPEED</div>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{robot.speed ?? 3.5} u/t</div>
        </div>
        <div className="glass" style={{ padding: '8px 6px', textAlign: 'center', borderRadius: 8 }}>
          <div style={{ color: '#64748b', fontSize: 9 }}>CAPACITY</div>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{robot.load_capacity ?? 60} kg</div>
        </div>
        <div className="glass" style={{ padding: '8px 6px', textAlign: 'center', borderRadius: 8 }}>
          <div style={{ color: '#64748b', fontSize: 9 }}>COMPLETED</div>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{robot.tasks_completed ?? 0} tasks</div>
        </div>
      </div>

      {/* Status & Routing Details */}
      <div style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>State:</span>
          <span style={{ fontWeight: 700 }}>{robot.state}</span>
        </div>
        {robot.task_id && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Assigned Task:</span>
            <span style={{ fontWeight: 700, color: '#818cf8' }}>{robot.task_id}</span>
          </div>
        )}
        {robot.yielding_to && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
            <span>Right-of-Way:</span>
            <span style={{ fontWeight: 700 }}>Yielding to {robot.yielding_to} (Detour)</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Comms Status:</span>
          <span style={{ fontWeight: 700, color: isCommDown ? '#ef4444' : '#22c55e' }}>
            {isCommDown ? 'Disconnected' : 'Online'}
          </span>
        </div>
      </div>
    </div>
  );
}
