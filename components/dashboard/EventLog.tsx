'use client';
import { useEffect, useRef } from 'react';

interface Props { events: string[]; }

function colour(ev: string): string {
  if (ev.includes('FAILURE') || ev.includes('offline')) return '#e53935';
  if (ev.includes('DEADLOCK'))    return '#a855f7';
  if (ev.includes('Conflict'))    return '#ff9800';
  if (ev.includes('battery low')) return '#ffa726';
  if (ev.includes('won task'))    return '#4caf50';
  if (ev.includes('COMM LOSS'))   return '#f59e0b';
  if (ev.includes('Restored'))    return '#10b981';
  return '#64748b';
}

export default function EventLog({ events }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [events]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Event Log</h3>
        <span style={{ fontSize: 10, color: '#4caf50', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
          LIVE
        </span>
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, paddingRight: 2 }}>
        {events.length === 0
          ? <div style={{ color: '#374151', fontSize: 12, fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
              Start simulation to see events...
            </div>
          : [...events].reverse().map((ev, i) => (
              <div key={i} style={{
                fontSize: 10.5, color: colour(ev),
                padding: '3px 7px', borderRadius: 5,
                background: i === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderLeft: '2px solid ' + (i === 0 ? colour(ev) : 'transparent'),
                fontFamily: 'monospace', lineHeight: 1.55,
                opacity: Math.max(0.25, 1 - i * 0.04),
              }}>{ev}</div>
            ))
        }
      </div>
    </div>
  );
}
