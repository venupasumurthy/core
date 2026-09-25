'use client';
import { useState } from 'react';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  controllerOnline: boolean;
  onToggleController: () => void;
  onInjectFailure: (type: 'MOTOR' | 'BATTERY' | 'COMMS', robotId?: string) => void;
}

export default function RoveraResilienceView({
  robots,
  zones,
  controllerOnline,
  onToggleController,
  onInjectFailure,
}: Props) {
  const [packetLoss, setPacketLoss] = useState(15);
  const [latencyJitter, setLatencyJitter] = useState(120);
  const [radioRadius, setRadioRadius] = useState(150);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Central Blackout Callout & Switch */}
      <div className="glass" style={{
        padding: '24px 28px',
        border: `1px solid ${controllerOnline ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.5)'}`,
        background: controllerOnline ? 'rgba(17, 24, 33, 0.85)' : 'rgba(239, 68, 68, 0.12)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: controllerOnline ? '#f8fafc' : '#f87171' }}>
              {controllerOnline ? 'Decentralized Central Controller: ONLINE' : 'CENTRAL CONTROLLER BLACKOUT: 100% P2P GOSSIP MESH MODE'}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: controllerOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.25)',
              border: `1px solid ${controllerOnline ? '#22c55e' : '#ef4444'}`,
              color: controllerOnline ? '#4ade80' : '#fca5a5',
            }}>
              {controllerOnline ? 'CENTRAL DISPATCH ACTIVE' : 'ZERO SINGLE POINT OF FAILURE'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 6, maxWidth: 840, lineHeight: 1.5 }}>
            {controllerOnline
              ? 'Click "Kill Central Controller" below to simulate an industrial central gateway blackout. Mission execution, spatial conflict resolution, and task re-auctions will continue completely uninterrupted via P2P mesh.'
              : 'The central orchestrator is DEAD. All robots are communicating via ad-hoc RF heartbeats, state replication, and distributed consensus (plan_assignments). No missions aborted.'}
          </p>
        </div>

        <button
          onClick={onToggleController}
          className={controllerOnline ? 'btn btn-danger' : 'btn btn-success'}
          style={{ width: 'auto', padding: '12px 28px', fontSize: 13, fontWeight: 700, borderRadius: 9999 }}
        >
          {controllerOnline ? 'Kill Central Controller' : 'Restore Central Controller'}
        </button>
      </div>

      {/* Grid: Interactive Fault Injection & Network Degradation Suite */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* One-Click Fault Injections */}
        <div className="glass" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 14 }}>
            Interactive Swarm Fault Injection Suite
          </h4>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Inject unexpected hardware or communications degradation into live operational agents to evaluate dynamic workload re-auction and recovery.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => onInjectFailure('MOTOR')}
              className="btn btn-ghost"
              style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', borderRadius: 12 }}
            >
              <span>Inject Motor Actuator Seizure / Mechanical Lock</span>
              <span style={{ fontSize: 11, background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '3px 10px', borderRadius: 9999, fontWeight: 700 }}>Trigger</span>
            </button>

            <button
              onClick={() => onInjectFailure('BATTERY')}
              className="btn btn-ghost"
              style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', borderRadius: 12 }}
            >
              <span>Sudden Battery Cell Collapse (Drop to 12% Critical)</span>
              <span style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.25)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '3px 10px', borderRadius: 9999, fontWeight: 700 }}>Trigger</span>
            </button>

            <button
              onClick={() => onInjectFailure('COMMS')}
              className="btn btn-ghost"
              style={{ justifyContent: 'space-between', padding: '12px 18px', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#c084fc', borderRadius: 12 }}
            >
              <span>RF Wireless Jamming / Network Disconnect (Packet Drop)</span>
              <span style={{ fontSize: 11, background: 'rgba(168, 85, 247, 0.25)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '3px 10px', borderRadius: 9999, fontWeight: 700 }}>Trigger</span>
            </button>
          </div>
        </div>

        {/* Network Degradation Controls */}
        <div className="glass" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 14 }}>
            Partial, Delayed, & Conflicting Information Controls
          </h4>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Simulate contested industrial radio environments. Robots fuse belief states with Bayesian multi-evidence models.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Packet Loss Rate:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{packetLoss}%</span>
              </div>
              <input
                type="range" min="0" max="45" value={packetLoss}
                onChange={e => setPacketLoss(Number(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Transmission Latency Jitter:</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{latencyJitter} ms</span>
              </div>
              <input
                type="range" min="0" max="800" step="20" value={latencyJitter}
                onChange={e => setLatencyJitter(Number(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Inter-Agent Ad-Hoc Radio Radius:</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>{radioRadius} m</span>
              </div>
              <input
                type="range" min="50" max="300" step="10" value={radioRadius}
                onChange={e => setRadioRadius(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
