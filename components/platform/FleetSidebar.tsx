'use client';
import { useState } from 'react';
import type { PlatformRobot, RobotPlatformState } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  onOpenCreateModal: () => void;
  onRecallToCharger: (robotId: string) => void;
  onSelectRobot: (robot: PlatformRobot) => void;
  onDeleteRobot?: (robotId: string) => void;
  selectedRobotId?: string | null;
}

const ROLE_ICONS: Record<string, string> = {
  WATER_COLLECTOR: '💧',
  PLANTER: '🌱',
  TRANSPORTER: '🚚',
  CLEANER: '📶',
  HEAVY_LIFTER: '🏗️',
  GENERAL: '✈',
};

const STATE_BADGES: Record<RobotPlatformState, { label: string; color: string; bg: string }> = {
  IDLE: { label: 'Idle / Ready', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  TRAVELLING: { label: 'In Transit', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  WORKING: { label: 'Working', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
  CHARGING: { label: 'Charging', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  RETURNING: { label: 'Returning', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
  FAILED: { label: 'Faulted', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export default function FleetSidebar({
  robots,
  onOpenCreateModal,
  onRecallToCharger,
  onSelectRobot,
  onDeleteRobot,
  selectedRobotId,
}: Props) {
  const [filter, setFilter] = useState<'ALL' | 'IDLE' | 'WORKING' | 'CHARGING'>('ALL');

  const filteredRobots = robots.filter(r => {
    if (filter === 'IDLE') return r.state === 'IDLE';
    if (filter === 'WORKING') return r.state === 'WORKING' || r.state === 'TRAVELLING';
    if (filter === 'CHARGING') return r.state === 'CHARGING';
    return true;
  });

  const handleDragStart = (e: React.DragEvent, robotId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ robotId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Sidebar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
            Fleet Units ({robots.length})
          </h3>
          <p style={{ fontSize: 11, color: '#64748b' }}>
            Drag to Zone to assign · Drag to Pad Alpha to dock
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}
          onClick={onOpenCreateModal}
        >
          + Create
        </button>
      </div>

      {/* Filter Tabs (Apple Glossy Segmented Controls) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, background: 'rgba(0, 0, 0, 0.25)', padding: 3, borderRadius: 9999, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {(['ALL', 'IDLE', 'WORKING', 'CHARGING'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 4px',
              borderRadius: 9999,
              background: filter === tab
                ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)'
                : 'transparent',
              border: filter === tab ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid transparent',
              boxShadow: filter === tab ? 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(56, 189, 248, 0.25)' : 'none',
              color: filter === tab ? '#ffffff' : '#94a3b8',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Robot Cards List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingRight: 2,
          maxHeight: 520,
        }}
      >
        {filteredRobots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#475569', fontSize: 12 }}>
            No robots matching this filter.
          </div>
        ) : (
          filteredRobots.map(r => {
            const badge = STATE_BADGES[r.state] || STATE_BADGES.IDLE;
            const isSelected = selectedRobotId === r.id;
            const isLowBattery = r.battery < 25;

            return (
              <div
                key={r.id}
                draggable={r.state !== 'CHARGING'}
                onDragStart={e => handleDragStart(e, r.id)}
                onClick={() => onSelectRobot(r)}
                className="glass"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: isSelected
                    ? '1.5px solid #38bdf8'
                    : isLowBattery
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  cursor: r.state !== 'CHARGING' ? 'grab' : 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Card Sub-Header with ID, Drag Indicator, and Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>
                    {r.id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {r.state !== 'CHARGING' && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '1.5px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ⋮⋮ DRAG
                      </span>
                    )}
                    {onDeleteRobot && r.state === 'IDLE' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Remove ${r.name} from fleet?`)) onDeleteRobot(r.id);
                        }}
                        title="Remove robot from fleet"
                        style={{
                          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.18) 100%)',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                          color: '#f87171',
                          width: 20,
                          height: 20,
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span>{ROLE_ICONS[r.role] ?? '🤖'}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 800, color: '#38bdf8', marginTop: -2 }}>
                      {r.labelCode || r.id.replace('R000', 'R')}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          color: badge.color,
                          background: badge.bg,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{r.id}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar if working */}
                {r.state === 'WORKING' && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4ade80', marginBottom: 2 }}>
                      <span>Working Progress</span>
                      <span>{Math.round(r.workProgress)}%</span>
                    </div>
                    <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${r.workProgress}%`,
                          height: '100%',
                          background: '#4ade80',
                          transition: 'width 0.3s linear',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Dual Bars: Battery & Health */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: '#94a3b8' }}>Battery</span>
                      <span style={{ fontWeight: 700, color: r.battery < 25 ? '#ef4444' : '#4ade80' }}>
                        {r.battery.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, r.battery))}%`,
                          height: '100%',
                          background: r.battery < 25 ? '#ef4444' : r.battery < 50 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: '#94a3b8' }}>Health</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>{r.health.toFixed(0)}%</span>
                    </div>
                    <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, r.health))}%`,
                          height: '100%',
                          background: '#38bdf8',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resource Load & Recall Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>
                    Load: <b style={{ color: '#cbd5e1' }}>{r.currentLoad}/{r.capacity}</b>
                  </span>

                  {r.state !== 'CHARGING' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRecallToCharger(r.id);
                      }}
                      title="Recall to Charge Pad Alpha"
                      style={{
                        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.2) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 2px 6px rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      ⚡ Dock Pad Alpha
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
