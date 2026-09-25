'use client';
import type { RobotData } from '@/types/simulation';

const STATES: Record<string, string> = {
  IDLE: '#9e9e9e', MOVING: '#2196f3', WORKING: '#4caf50',
  CHARGING: '#ff9800', FAILED: '#e53935',
};

export default function StatePieChart({ robots }: { robots: RobotData[] }) {
  const counts: Record<string, number> = {};
  robots.forEach(r => { counts[r.state] = (counts[r.state] ?? 0) + 1; });
  const total = robots.length || 1;

  const cx = 56, cy = 56, R = 44, ir = 24;
  let angle = -Math.PI / 2;

  const segs = Object.entries(STATES).flatMap(([state, color]) => {
    const n = counts[state] ?? 0;
    if (!n) return [];
    const sweep = (n / total) * Math.PI * 2;
    const ea = angle + sweep;
    const cos0 = Math.cos(angle), sin0 = Math.sin(angle);
    const cosE = Math.cos(ea),    sinE = Math.sin(ea);
    const lf = sweep > Math.PI ? 1 : 0;
    const d = [
      `M${cx + R * cos0} ${cy + R * sin0}`,
      `A${R} ${R} 0 ${lf} 1 ${cx + R * cosE} ${cy + R * sinE}`,
      `L${cx + ir * cosE} ${cy + ir * sinE}`,
      `A${ir} ${ir} 0 ${lf} 0 ${cx + ir * cos0} ${cy + ir * sin0}`,
      'Z',
    ].join(' ');
    angle = ea;
    return [{ state, color, d }];
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={112} height={112} style={{ flexShrink: 0 }}>
        {segs.map(({ state, color, d }) => (
          <path key={state} d={d} fill={color} opacity={0.85} />
        ))}
        <text x={cx} y={cy - 5}  textAnchor="middle" fill="white"   fontSize={17} fontWeight={800}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize={8}>ROBOTS</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(STATES).map(([st, col]) => {
          const n = counts[st] ?? 0;
          return (
            <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{st}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{n}</span>
              <span style={{ fontSize: 11, color: '#374151', minWidth: 30, textAlign: 'right' }}>
                {Math.round(n / total * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
