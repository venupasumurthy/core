'use client';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robot: PlatformRobot | null;
  zone: WorkZone | null;
  idleRobots: PlatformRobot[];
  onRecallToCharger: (robotId: string) => void;
  onDispatchReplacement: (replacementRobotId: string, zoneId: string) => void;
  onDismiss: () => void;
}

export default function LowBatteryPromptModal({
  robot,
  zone,
  idleRobots,
  onRecallToCharger,
  onDispatchReplacement,
  onDismiss,
}: Props) {
  if (!robot || !zone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 140,
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
          maxWidth: 520,
          padding: '28px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          borderRadius: 20,
          boxShadow: '0 16px 50px rgba(239, 68, 68, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            🔋
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: 1 }}>
                CRITICAL BATTERY ALERT (≤20%)
              </span>
              <button
                onClick={onDismiss}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {robot.name} Needs Immediate Attention
            </h3>

            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginTop: 6 }}>
              Battery dropped to <b style={{ color: '#ef4444' }}>{robot.battery.toFixed(0)}%</b> while executing work in <b style={{ color: '#38bdf8' }}>{zone.name}</b>.
              Task is currently paused to prevent complete battery cell depletion.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          {/* Action 1: Recall to Charging Bay */}
          <button
            onClick={() => onRecallToCharger(robot.id)}
            className="btn"
            style={{
              padding: '12px 18px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              justifyContent: 'flex-start',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Recall {robot.name} to Central Charging Bay</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Autonomously routes to charger; docks until 100% capacity</div>
            </div>
          </button>

          {/* Action 2: Dispatch Replacement Robot */}
          {idleRobots.length > 0 ? (
            <div
              style={{
                padding: '14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔄</span> Send Replacement Robot:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
                {idleRobots.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onDispatchReplacement(r.id, zone.id)}
                    className="btn"
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#c7d2fe',
                      justifyContent: 'space-between',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🤖</span>
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>({r.role})</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
                      {r.battery.toFixed(0)}% Bat ➔ Take Over Zone
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', color: '#94a3b8', fontSize: 12 }}>
              ℹ️ No idle replacement robots available in fleet right now.
            </div>
          )}

          <button
            onClick={onDismiss}
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 4 }}
          >
            Dismiss Alert (Keep Paused)
          </button>
        </div>
      </div>
    </div>
  );
}
