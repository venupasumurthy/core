'use client';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  operatorName: string;
}

export default function FleetOverviewBar({ robots, zones, operatorName }: Props) {
  const totalRobots = robots.length;
  const idleCount = robots.filter(r => r.state === 'IDLE').length;
  const workingCount = robots.filter(r => r.state === 'WORKING' || r.state === 'TRAVELLING').length;
  const chargingCount = robots.filter(r => r.state === 'CHARGING').length;
  const failedCount = robots.filter(r => r.state === 'FAILED').length;

  const completedZones = zones.filter(z => z.status === 'COMPLETED').length;
  const avgBattery = totalRobots ? Math.round(robots.reduce((acc, r) => acc + r.battery, 0) / totalRobots) : 100;
  const avgHealth = totalRobots ? Math.round(robots.reduce((acc, r) => acc + r.health, 0) / totalRobots) : 100;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
      {/* Fleet Total */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>FLEET TOTAL</span>
          <span>🤖</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
          {totalRobots}
        </div>
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
          {idleCount} Idle · {workingCount} Active
        </div>
      </div>

      {/* Working Operations */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>OPERATIONS</span>
          <span>⚙️</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
          {workingCount}
        </div>
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
          {zones.filter(z => z.status === 'IN_PROGRESS').length} Zones in Progress
        </div>
      </div>

      {/* Charging Bay Status */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>CHARGING</span>
          <span>⚡</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
          {chargingCount}
        </div>
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
          Auto-recall enabled
        </div>
      </div>

      {/* Zones Completed */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>COMPLETED</span>
          <span>🏆</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
          {completedZones} <span style={{ fontSize: 13, color: '#64748b' }}>/ {zones.length}</span>
        </div>
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
          {zones.filter(z => z.status === 'OVERDUE').length} Overdue
        </div>
      </div>

      {/* Avg Battery */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>AVG BATTERY</span>
          <span>🔋</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: avgBattery < 30 ? '#ef4444' : '#22c55e', marginTop: 4 }}>
          {avgBattery}%
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
          <div style={{ width: `${avgBattery}%`, height: '100%', background: avgBattery < 30 ? '#ef4444' : '#22c55e' }} />
        </div>
      </div>

      {/* Avg Health */}
      <div className="glass metric-card" style={{ padding: '12px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>AVG HEALTH</span>
          <span>❤️</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: avgHealth < 50 ? '#f59e0b' : '#38bdf8', marginTop: 4 }}>
          {avgHealth}%
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
          <div style={{ width: `${avgHealth}%`, height: '100%', background: '#38bdf8' }} />
        </div>
      </div>
    </div>
  );
}
