'use client';
import type { CoordinationAlert, PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  alert: CoordinationAlert | null;
  idleRobots: PlatformRobot[];
  zones: WorkZone[];
  onAssignTransport: (transportRobotId: string) => void;
  onOpenCreateRobot?: () => void;
  onDismiss: () => void;
}

export default function CoordinationPromptModal({
  alert,
  idleRobots,
  zones,
  onAssignTransport,
  onOpenCreateRobot,
  onDismiss,
}: Props) {
  if (!alert) return null;

  const sourceZone = zones.find(z => z.id === alert.sourceZoneId);
  const targetZone = zones.find(z => z.id === alert.targetZoneId);
  const transporters = idleRobots.filter(r => r.role === 'TRANSPORTER' || r.role === 'GENERAL');
  const availableCandidates = transporters.length > 0 ? transporters : idleRobots;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 130,
        maxWidth: 480,
        width: 'calc(100% - 48px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className="glass glow"
        style={{
          padding: '22px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: 18,
          boxShadow: '0 12px 40px rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🔄
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: 1 }}>
                MULTI-ROBOT COORDINATION REQUIRED
              </span>
              <button
                onClick={onDismiss}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
              Resource Dependency Detected
            </h3>

            <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.55, marginTop: 6 }}>
              {alert.message}
            </p>

            {/* Visual Route flow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '12px 0',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 8,
                fontSize: 11,
              }}
            >
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{sourceZone?.name ?? 'Source Zone'}</span>
              <span style={{ color: '#f59e0b' }}>───({alert.amount}L {alert.resourceType})───►</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>{targetZone?.name ?? 'Target Zone'}</span>
            </div>

            {/* Selection of Transport Robot */}
            {availableCandidates.length > 0 ? (
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Select an idle robot to dispatch for transport:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
                  {availableCandidates.map(r => (
                    <button
                      key={r.id}
                      onClick={() => onAssignTransport(r.id)}
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#c7d2fe',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🚚</span>
                        <span style={{ fontWeight: 700 }}>{r.name}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>({r.role})</span>
                      </span>
                      <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
                        {r.battery.toFixed(0)}% Battery ➔ Dispatch
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#f87171', padding: '6px 0' }}>
                ⚠️ No idle robots available!
              </div>
            )}

            {/* Option to create a new robot */}
            {onOpenCreateRobot && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    onDismiss();
                    onOpenCreateRobot();
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', fontSize: 11, padding: '6px 12px', border: '1px dashed rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
                >
                  + Commission New Transporter Robot
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
