'use client';
import type { Metrics } from '@/types/simulation';

interface Props { tick: number; metrics: Metrics; running: boolean; }

const COLS = [
  { key: 'tick',               icon: '⏱️', label: 'Tick',      color: '#6366f1' },
  { key: 'tasks_completed',    icon: '✅',  label: 'Completed', color: '#10b981' },
  { key: 'conflicts_resolved', icon: '⚡',  label: 'Conflicts', color: '#06b6d4' },
  { key: 'deadlocks_resolved', icon: '🔒', label: 'Deadlocks', color: '#a855f7' },
  { key: 'robots_failed',      icon: '💥', label: 'Failed',    color: '#e53935' },
  { key: 'robots_charging',    icon: '🔋', label: 'Charging',  color: '#ff9800' },
] as const;

export default function MetricsBar({ tick, metrics, running }: Props) {
  const vals: Record<string, number> = { tick, ...metrics };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, padding: '16px 0' }}>
      {COLS.map(({ key, icon, label, color }) => (
        <div key={key} className="glass metric-card" style={{ padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color, lineHeight: 1 }}>
            {vals[key] ?? 0}
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginTop: 4, fontWeight: 700, letterSpacing: 0.5 }}>
            {label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}
