'use client';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  operatorName: string;
}

export default function FleetOverviewBar({ robots, zones }: Props) {
  const totalRobots = robots.length;
  const idleCount = robots.filter(r => r.state === 'IDLE').length;
  const workingCount = robots.filter(r => r.state === 'WORKING' || r.state === 'TRAVELLING').length;
  const chargingCount = robots.filter(r => r.state === 'CHARGING').length;

  const completedZones = zones.filter(z => z.status === 'COMPLETED').length;
  const inProgressZones = zones.filter(z => z.status === 'IN_PROGRESS').length;
  const standbyZones = zones.filter(z => z.status === 'UNASSIGNED').length;

  const avgBattery = totalRobots ? Math.round(robots.reduce((acc, r) => acc + r.battery, 0) / totalRobots) : 91;
  const avgHealth = totalRobots ? Math.round(robots.reduce((acc, r) => acc + r.health, 0) / totalRobots) : 98;

  const cards = [
    {
      title: 'FLEET TOTAL',
      icon: '🤖',
      value: `${totalRobots}`,
      subtitle: `${idleCount} Idle · ${workingCount} Active`,
      accentColor: '#38bdf8',
      iconBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.15))',
    },
    {
      title: 'OPERATIONS',
      icon: '⚡',
      value: `${workingCount}`,
      subtitle: `${inProgressZones} In Progress · ${completedZones} Done`,
      accentColor: '#4ade80',
      iconBg: 'linear-gradient(135deg, rgba(74, 222, 128, 0.25), rgba(22, 163, 74, 0.15))',
    },
    {
      title: 'CHARGING PAD',
      icon: '🔋',
      value: `${chargingCount}`,
      subtitle: 'Alpha Bay (+4%/tick)',
      accentColor: '#f59e0b',
      iconBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
    },
    {
      title: 'WORK ZONES',
      icon: '🎯',
      value: `${completedZones} / ${zones.length}`,
      subtitle: `${standbyZones} Standby Zones`,
      accentColor: '#c084fc',
      iconBg: 'linear-gradient(135deg, rgba(192, 132, 252, 0.25), rgba(147, 51, 234, 0.15))',
    },
    {
      title: 'AVG BATTERY',
      icon: '⚡',
      value: `${avgBattery}%`,
      subtitle: 'Induction Active',
      accentColor: avgBattery < 30 ? '#ef4444' : '#22c55e',
      iconBg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.15))',
      hasBar: true,
      barPercent: avgBattery,
    },
    {
      title: 'AVG HEALTH',
      icon: '🛡️',
      value: `${avgHealth}%`,
      subtitle: 'Nominal Fleet State',
      accentColor: avgHealth < 60 ? '#f59e0b' : '#38bdf8',
      iconBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
      hasBar: true,
      barPercent: avgHealth,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 16,
      }}
    >
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="metric-card"
          style={{
            padding: '16px 18px',
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(15, 23, 42, 0.78) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.35), 0 8px 24px rgba(0, 0, 0, 0.38)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            gap: 6,
          }}
        >
          {/* Line 1: Title */}
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {c.title}
          </div>

          {/* Line 2: Apple Glossy Squircle Icon */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: c.iconBg,
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
              }}
            >
              {c.icon}
            </div>
          </div>

          {/* Line 3: Hero Value */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: c.accentColor || '#f8fafc',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {c.value}
          </div>

          {/* Optional progress bar for battery / health */}
          {c.hasBar && (
            <div
              style={{
                width: '100%',
                height: 4.5,
                borderRadius: 9999,
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                margin: '2px 0 0',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${c.barPercent}%`,
                  height: '100%',
                  background: c.accentColor,
                  borderRadius: 9999,
                  boxShadow: `0 0 10px ${c.accentColor}aa`,
                }}
              />
            </div>
          )}

          {/* Line 4: Subtitle */}
          <div
            style={{
              fontSize: 11.5,
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
              marginTop: c.hasBar ? 2 : 4,
            }}
          >
            {c.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
