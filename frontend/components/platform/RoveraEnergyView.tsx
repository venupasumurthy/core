'use client';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  onRecallToCharger: (robotId: string) => void;
}

export default function RoveraEnergyView({ robots, zones, onRecallToCharger }: Props) {
  // Compute Energy Feasibility Audit for each robot
  const auditData = robots.map(r => {
    const isWorking = r.state === 'WORKING' || r.state === 'TRAVELLING';
    const distToZone = r.assignedZoneId ? 180 : 60;
    const eTransit = Math.round((distToZone / 100) * 8); // % energy
    const eExec = r.assignedZoneId ? 28 : 0;
    const eRTB = 14;
    const eReserve = 15; // mandatory safety reserve
    const eTotal = eTransit + eExec + eRTB + eReserve;
    const isFeasible = r.battery >= eTotal;

    return {
      robot: r,
      eTransit,
      eExec,
      eRTB,
      eReserve,
      eTotal,
      isFeasible,
      decision: isFeasible ? 'APPROVED' : r.battery <= 25 ? 'CRITICAL RTB' : 'MARGINAL (RTB RECOMMENDED)',
    };
  });

  const chargingRobots = robots.filter(r => r.state === 'CHARGING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Top Header Card */}
      <div className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
              Battery-Aware Task Allocation & Return-To-Base (RTB) Scheduling
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#4ade80',
            }}>
              RTB Auto-Dispatch Active
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Energy Feasibility Audit formula: E_total = E_transit + E_execution + E_RTB + E_reserve (15%)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.35)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CHARGING BAYS DOCKED</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{chargingRobots.length} / 3 Bays</div>
          </div>
          <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.35)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>RECHARGE RATE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>+4.0% / tick</div>
          </div>
        </div>
      </div>

      {/* 3 Charging Stations Alpha, Beta, Gamma status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { name: 'Pad Alpha (North-East)', id: 'alpha', x: '820', y: '80', bay: 'Bay 1' },
          { name: 'Pad Beta (South-West)', id: 'beta', x: '100', y: '700', bay: 'Bay 2' },
          { name: 'Pad Gamma (South-East)', id: 'gamma', x: '850', y: '700', bay: 'Bay 3' },
        ].map((pad, idx) => {
          const occupant = chargingRobots[idx];
          return (
            <div key={pad.id} className="glass" style={{ padding: 18, borderLeft: `4px solid ${occupant ? '#f59e0b' : '#22c55e'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{pad.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: occupant ? '#f59e0b' : '#22c55e' }}>
                  {occupant ? '⚡ OCCUPIED' : '🟢 AVAILABLE'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Coordinates: ({pad.x}, {pad.y}) · {pad.bay}</div>
              {occupant ? (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>
                    <span>{occupant.name}</span>
                    <span>{occupant.battery.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6 }}>
                    <div style={{ width: `${occupant.battery}%`, height: '100%', background: '#fbbf24', borderRadius: 2 }} />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                  Ready to accept automated RTB docking.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Energy Feasibility Audit Table */}
      <div className="glass" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📋</span> Mission Energy Feasibility Audit Table (Pre-Commitment Verification)
        </h4>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '8px 6px' }}>Robot</th>
              <th style={{ padding: '8px 6px' }}>Role</th>
              <th style={{ padding: '8px 6px' }}>Current SOC</th>
              <th style={{ padding: '8px 6px' }}>E_transit</th>
              <th style={{ padding: '8px 6px' }}>E_exec</th>
              <th style={{ padding: '8px 6px' }}>E_RTB</th>
              <th style={{ padding: '8px 6px' }}>E_reserve (15%)</th>
              <th style={{ padding: '8px 6px' }}>Total Required</th>
              <th style={{ padding: '8px 6px' }}>Feasibility Decision</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auditData.map(({ robot, eTransit, eExec, eRTB, eReserve, eTotal, isFeasible, decision }) => (
              <tr key={robot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 6px', fontWeight: 600, color: '#f1f5f9' }}>{robot.name}</td>
                <td style={{ padding: '10px 6px', color: '#94a3b8' }}>{robot.role}</td>
                <td style={{ padding: '10px 6px' }}>
                  <span style={{ fontWeight: 800, color: robot.battery < 25 ? '#ef4444' : robot.battery < 60 ? '#f59e0b' : '#22c55e' }}>
                    {robot.battery.toFixed(0)}%
                  </span>
                </td>
                <td style={{ padding: '10px 6px', color: '#94a3b8' }}>{eTransit}%</td>
                <td style={{ padding: '10px 6px', color: '#94a3b8' }}>{eExec}%</td>
                <td style={{ padding: '10px 6px', color: '#94a3b8' }}>{eRTB}%</td>
                <td style={{ padding: '10px 6px', color: '#38bdf8' }}>{eReserve}%</td>
                <td style={{ padding: '10px 6px', fontWeight: 800, color: '#e2e8f0' }}>{eTotal}%</td>
                <td style={{ padding: '10px 6px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                    background: isFeasible ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                    color: isFeasible ? '#4ade80' : '#f87171',
                    border: `1px solid ${isFeasible ? '#22c55e' : '#ef4444'}`,
                  }}>
                    {decision}
                  </span>
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <button
                    onClick={() => onRecallToCharger(robot.id)}
                    disabled={robot.state === 'CHARGING'}
                    className="btn btn-warning"
                    style={{ width: 'auto', padding: '5px 12px', fontSize: 11, borderRadius: 6 }}
                  >
                    ⚡ Send RTB
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
