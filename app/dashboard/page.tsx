'use client';
import { useState } from 'react';
import { useSimulation }   from '@/hooks/useSimulation';
import RobotMap            from '@/components/dashboard/RobotMap';
import MetricsBar          from '@/components/dashboard/MetricsBar';
import SimControls         from '@/components/dashboard/SimControls';
import EventLog            from '@/components/dashboard/EventLog';
import FailureButtons      from '@/components/dashboard/FailureButtons';
import StatePieChart       from '@/components/dashboard/StatePieChart';
import RobotInspector      from '@/components/dashboard/RobotInspector';
import type { RobotData }  from '@/types/simulation';

export default function DashboardPage() {
  const { snapshot, connected, send } = useSimulation();
  const [worldSize, setWorldSize] = useState(500);
  const [selectedRobot, setSelectedRobot] = useState<RobotData | null>(null);

  const robots   = snapshot?.robots            ?? [];
  const tasks    = snapshot?.tasks             ?? [];
  const stations = snapshot?.charging_stations ?? [];
  const metrics  = snapshot?.metrics ?? {
    tasks_completed: 0, conflicts_resolved: 0,
    deadlocks_resolved: 0, robots_failed: 0, robots_charging: 0,
  };
  const events  = snapshot?.event_log ?? [];
  const running = snapshot?.running   ?? false;
  const controllerOnline = snapshot?.controller_online ?? true;

  // Keep selected robot data fresh with each snapshot
  const activeSelectedRobot = selectedRobot
    ? robots.find(r => r.id === selectedRobot.id) ?? selectedRobot
    : null;

  return (
    <div style={{ padding: '0 20px 48px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🤖 Fleet Operations Center</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: controllerOnline ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)',
              border: `1px solid ${controllerOnline ? '#22c55e' : '#ef4444'}`,
              color: controllerOnline ? '#4ade80' : '#f87171',
            }}>
              {controllerOnline ? '● Central Controller ONLINE' : '⚡ P2P MESH MODE (Controller Offline)'}
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Decentralized task allocation · Vectorized conflict prediction & detour routes · Deadlock graph recovery · Shared charging bays
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Active Fleet:</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#6366f1' }}>{robots.length} Robots</span>
        </div>
      </div>

      {/* Controller Blackout Alert Banner */}
      {!controllerOnline && (
        <div style={{
          marginBottom: 16, padding: '14px 20px', borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.45)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#f87171' }}>
              CENTRAL COORDINATION SERVICE IS OFFLINE (FAULT-TOLERANCE DEMONSTRATION)
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>
              The entire fleet continues mission execution without interruption: task auctions, spatial right-of-way, and battery-aware rerouting run 100% peer-to-peer.
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <MetricsBar tick={snapshot?.tick ?? 0} metrics={metrics} running={running} />

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
        {/* Left: Fleet Map */}
        <div className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>High-Density Facility Map</h2>
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span>◆ Open Tasks</span>
              <span>■ Charging Bays</span>
              <span style={{ color: running ? '#4caf50' : '#64748b', fontWeight: 600 }}>
                {running ? '● Running' : '⏸ Paused'}
              </span>
            </div>
          </div>
          <RobotMap
            robots={robots}
            tasks={tasks}
            stations={stations}
            worldSize={worldSize}
            selectedRobotId={activeSelectedRobot?.id}
            onSelectRobot={setSelectedRobot}
          />
        </div>

        {/* Right: Controls & Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeSelectedRobot && (
            <RobotInspector
              robot={activeSelectedRobot}
              onClose={() => setSelectedRobot(null)}
              send={send}
            />
          )}

          <div className="glass" style={{ padding: 18 }}>
            <SimControls
              running={running} connected={connected}
              send={send} onWorldSizeChange={setWorldSize}
            />
          </div>
          <div className="glass" style={{ padding: 18 }}>
            <FailureButtons
              connected={connected}
              controllerOnline={controllerOnline}
              send={send}
            />
          </div>
          <div className="glass" style={{ padding: 18, flex: 1, minHeight: 250, display: 'flex', flexDirection: 'column' }}>
            <EventLog events={events} />
          </div>
        </div>
      </div>

      {/* Bottom charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div className="glass" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
            Robot State Distribution
          </h3>
          <StatePieChart robots={robots} />
        </div>
        <div className="glass" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
            Mission & Resource Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Open Tasks',   value: tasks.filter(t => !t.assigned_to).length, c: '#94a3b8' },
              { label: 'Assigned',     value: tasks.filter(t =>  t.assigned_to).length, c: '#2196f3' },
              { label: 'Completed',    value: metrics.tasks_completed,                  c: '#4caf50' },
              { label: 'Active Tasks', value: tasks.length,                             c: '#6366f1' },
            ].map(({ label, value, c }) => (
              <div key={label} className="glass" style={{ padding: '14px 10px', textAlign: 'center', borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="glass" style={{ padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CHARGING STATIONS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ff9800', marginTop: 4 }}>
                {stations.reduce((acc, s) => acc + (s.occupied ?? 0), 0)} / {stations.reduce((acc, s) => acc + (s.capacity ?? 4), 0)} Bays Occupied
              </div>
            </div>
            <div className="glass" style={{ padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CONSENSUS PROTOCOL</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginTop: 6 }}>
                Contract Net + Pure DFS Graph
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
