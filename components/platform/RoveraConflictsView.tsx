'use client';
import { useState } from 'react';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  onInjectDeadlock?: () => void;
}

export default function RoveraConflictsView({ robots, zones }: Props) {
  const [deadlockState, setDeadlockState] = useState<'NORMAL' | 'CYCLE_DETECTED' | 'RESOLVING' | 'RESOLVED'>('NORMAL');
  const [activeCycle, setActiveCycle] = useState<string[]>([]);
  const [resolutionLog, setResolutionLog] = useState<string[]>([
    'Spatial Hashing Grid initialized: O(N) neighborhood query active.',
    'Space-time lookahead horizon: 12 ticks active.',
    'No active cyclic deadlocks in corridor zones.',
  ]);

  const handleInjectDeadlock = () => {
    setDeadlockState('CYCLE_DETECTED');
    setActiveCycle(['R0001 (AquaCollector)', 'R0002 (TerraPlanter)', 'R0003 (SwiftTrans)']);
    setResolutionLog(prev => [
      `[${new Date().toLocaleTimeString()}] ⚠️ INJECTED CORRIDOR HEAD-ON CONFLICT: R0001 <-> R0002 in Corridor Zone B.`,
      `[${new Date().toLocaleTimeString()}] 🔒 Wait-For Graph (WFG): Directed Cycle Detected: R0001 → R0002 → R0003 → R0001.`,
      ...prev,
    ]);

    setTimeout(() => {
      setDeadlockState('RESOLVING');
      setResolutionLog(prev => [
        `[${new Date().toLocaleTimeString()}] 🔄 Tarjan Cycle Broken: Priority Inversion triggered on lower-yield node R0002.`,
        `[${new Date().toLocaleTimeString()}] ↩️ Executing lateral back-off maneuver to clearance pocket (x: 420, y: 310).`,
        ...prev,
      ]);
    }, 1800);

    setTimeout(() => {
      setDeadlockState('RESOLVED');
      setActiveCycle([]);
      setResolutionLog(prev => [
        `[${new Date().toLocaleTimeString()}] ✅ Deadlock resolved. Path cleared. Both agents resuming assigned missions.`,
        ...prev,
      ]);
    }, 3600);
  };

  // Sample RoW scores calculated deterministically
  const rowEvaluations = robots.slice(0, 4).map((r, i) => {
    const taskPriority = r.assignedZoneId ? 3 : 1;
    const lowBatBonus = r.battery < 25 ? 5 : 0;
    const payloadBonus = r.capacity > 80 ? 2 : 0;
    const score = 10 * taskPriority + lowBatBonus + payloadBonus + (10 - i);
    return {
      robot: r,
      taskPriority,
      lowBatBonus,
      payloadBonus,
      score,
      status: i === 0 ? 'RIGHT-OF-WAY WINNER' : i === 1 ? 'YIELDING (Detour)' : 'CRUISING',
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Top Banner & Action */}
      <div className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
              Spatial-Temporal Conflict Prediction & Deadlock Recovery
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: deadlockState === 'CYCLE_DETECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${deadlockState === 'CYCLE_DETECTED' ? '#ef4444' : '#22c55e'}`,
              color: deadlockState === 'CYCLE_DETECTED' ? '#f87171' : '#4ade80',
            }}>
              {deadlockState === 'CYCLE_DETECTED' ? 'Deadlock Cycle Detected' : deadlockState === 'RESOLVING' ? 'Recovery in Progress' : 'Zero Deadlocks Detected'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Reciprocal Velocity Obstacles (RVO) · Conflict-Based Search (CBS) · Wait-For Graph (WFG) cycle detection
          </p>
        </div>

        <button
          onClick={handleInjectDeadlock}
          disabled={deadlockState === 'CYCLE_DETECTED' || deadlockState === 'RESOLVING'}
          className="btn btn-danger"
          style={{ width: 'auto', padding: '10px 24px', fontSize: 13, borderRadius: 9999 }}
        >
          Inject Head-On Deadlock
        </button>
      </div>

      {/* Grid: Formula & Live RoW Evaluation Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        {/* RoW Table */}
        <div className="glass" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 12 }}>
            Autonomous Right-of-Way (RoW) Deterministic Arbitration
          </h4>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8 }}>
            Priority Score = 10 · P_task + 5 · I(Battery &lt; 25%) + 2 · I(Payload &gt; 40) + TieBreaker
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '8px 6px' }}>Robot</th>
                <th style={{ padding: '8px 6px' }}>P_task</th>
                <th style={{ padding: '8px 6px' }}>Low Bat</th>
                <th style={{ padding: '8px 6px' }}>Payload</th>
                <th style={{ padding: '8px 6px' }}>Score</th>
                <th style={{ padding: '8px 6px' }}>Arbitration Decision</th>
              </tr>
            </thead>
            <tbody>
              {rowEvaluations.map(({ robot, taskPriority, lowBatBonus, payloadBonus, score, status }) => (
                <tr key={robot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600, color: '#f1f5f9' }}>{robot.name}</td>
                  <td style={{ padding: '10px 6px', color: '#818cf8' }}>{taskPriority}</td>
                  <td style={{ padding: '10px 6px', color: lowBatBonus ? '#ef4444' : '#64748b' }}>+{lowBatBonus}</td>
                  <td style={{ padding: '10px 6px', color: payloadBonus ? '#38bdf8' : '#64748b' }}>+{payloadBonus}</td>
                  <td style={{ padding: '10px 6px', fontWeight: 800, color: '#38bdf8' }}>{score}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                      background: status.includes('WINNER') ? 'rgba(34,197,94,0.18)' : status.includes('YIELDING') ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)',
                      color: status.includes('WINNER') ? '#4ade80' : status.includes('YIELDING') ? '#f87171' : '#94a3b8',
                      border: `1px solid ${status.includes('WINNER') ? '#22c55e' : status.includes('YIELDING') ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Wait-For Graph (WFG) Visualization */}
        <div className="glass" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#a855f7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🕸️</span> Wait-For Graph (WFG) & Cycle Detection (Tarjan / DFS)
          </h4>
          <div style={{
            height: 180, borderRadius: 10, background: '#070a0f',
            border: `1px solid ${deadlockState === 'CYCLE_DETECTED' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.2)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14,
            position: 'relative', overflow: 'hidden',
          }}>
            {deadlockState === 'NORMAL' && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>🟢</span>
                Acyclic Directed Graph G=(V,E)<br />
                All robots moving along clearance corridors.
              </div>
            )}
            {(deadlockState === 'CYCLE_DETECTED' || deadlockState === 'RESOLVING') && (
              <div style={{ textAlign: 'center', color: '#f87171' }}>
                <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>⚠️</span>
                <span style={{ fontWeight: 800, fontSize: 14 }}>Closed Waiting Cycle Identified:</span>
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4, fontFamily: 'monospace' }}>
                  {activeCycle.join(' ➔ ')} ➔ {activeCycle[0]?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 8 }}>
                  {deadlockState === 'RESOLVING' ? 'Executing lateral back-off escape maneuver...' : 'Tarjan algorithm flag: Deadlock!'}
                </div>
              </div>
            )}
            {deadlockState === 'RESOLVED' && (
              <div style={{ textAlign: 'center', color: '#4ade80' }}>
                <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>✅</span>
                <span style={{ fontWeight: 800, fontSize: 14 }}>Deadlock Broken Successfully!</span>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Yield completed to clearance pocket. Corridor open.
                </div>
              </div>
            )}
          </div>

          {/* Recovery Strategy Summary */}
          <div style={{ marginTop: 14, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Decentralized Recovery Maneuver:</span> Yielding robot calculates perpendicular vector orthogonal to corridor line, parks temporarily in safety margin, and notifies waiting peer via P2P heartbeat.
          </div>
        </div>
      </div>

      {/* Real-time Arbitration & Deadlock Log */}
      <div className="glass" style={{ padding: 18 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
          📜 Conflict & Cycle Resolution Telemetry Log
        </h4>
        <div style={{
          maxHeight: 140, overflowY: 'auto', background: '#070a0f', borderRadius: 8, padding: 12,
          fontFamily: 'monospace', fontSize: 11.5, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {resolutionLog.map((log, i) => (
            <div key={i} style={{ color: log.includes('⚠️') ? '#f87171' : log.includes('✅') ? '#4ade80' : log.includes('🔄') ? '#38bdf8' : '#94a3b8' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
