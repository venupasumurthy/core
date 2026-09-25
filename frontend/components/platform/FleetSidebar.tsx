'use client';
import { useState } from 'react';
import type { PlatformRobot, RobotPlatformState } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  onOpenCreateModal: () => void;
  onRecallToCharger: (robotId: string) => void;
  onSelectRobot: (robot: PlatformRobot) => void;
  selectedRobotId?: string | null;
}

const ROLE_ICONS: Record<string, string> = {
  WATER_COLLECTOR: '💧',
  PLANTER: '🌱',
  TRANSPORTER: '🚚',
  CLEANER: '🧹',
  HEAVY_LIFTER: '🏗️',
  GENERAL: '🤖',
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
            🤖 Robot Fleet ({robots.length})
          </h3>
          <p style={{ fontSize: 11, color: '#64748b' }}>
            Drag robot onto map zone to assign
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

      {/* Filter Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {(['ALL', 'IDLE', 'WORKING', 'CHARGING'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 4px',
              borderRadius: 6,
              background: filter === tab ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${filter === tab ? '#6366f1' : 'transparent'}`,
              color: filter === tab ? '#c7d2fe' : '#64748b',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
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
                draggable={r.state === 'IDLE'}
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
                  cursor: r.state === 'IDLE' ? 'grab' : 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Drag Handle Indicator for Idle Robots */}
                {r.state === 'IDLE' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: 10,
                      color: '#6366f1',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    ⋮⋮ DRAG ME
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {ROLE_ICONS[r.role] ?? '🤖'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                  {r.battery < 40 && r.state !== 'CHARGING' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRecallToCharger(r.id);
                      }}
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Charge
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
