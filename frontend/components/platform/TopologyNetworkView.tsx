'use client';
import { useEffect, useRef } from 'react';
import type { InterRobotMessage, PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  messages: InterRobotMessage[];
}

export default function TopologyNetworkView({ robots, zones, messages }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Draw Cisco-style network topology
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (Cisco / Blueprint style)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Node positioning in a circular topology
    const centerX = W / 2;
    const centerY = H / 2;
    const radius = Math.min(W, H) * 0.36;

    const activeRobots = robots.filter(r => r.state !== 'FAILED');
    const nodeCoords: Record<string, { x: number; y: number; r: PlatformRobot }> = {};

    activeRobots.forEach((r, idx) => {
      const angle = (idx / (activeRobots.length || 1)) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      nodeCoords[r.id] = { x, y, r };
    });

    // Draw Communication Links between robots
    // Especially connect robots involved in coordination or same zones
    const time = Date.now() / 1000;
    const robotKeys = Object.keys(nodeCoords);

    for (let i = 0; i < robotKeys.length; i++) {
      for (let j = i + 1; j < robotKeys.length; j++) {
        const u = nodeCoords[robotKeys[i]];
        const v = nodeCoords[robotKeys[j]];

        const isCoordinating =
          (u.r.role === 'WATER_COLLECTOR' && v.r.role === 'TRANSPORTER') ||
          (u.r.role === 'TRANSPORTER' && v.r.role === 'PLANTER') ||
          (u.r.assignedZoneId && u.r.assignedZoneId === v.r.assignedZoneId);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);

        if (isCoordinating) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 5]);
          ctx.stroke();

          // Animated data packet along the link
          const progress = (time * 0.4 + i * 0.2) % 1;
          const px = u.x + (v.x - u.x) * progress;
          const py = u.y + (v.y - u.y) * progress;

          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Draw Central Mesh Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P2P MESH', centerX, centerY + 3);
    ctx.restore();

    // Draw Robot Nodes
    Object.values(nodeCoords).forEach(({ x, y, r }) => {
      ctx.save();
      // Outer status ring
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle =
        r.state === 'WORKING'
          ? '#4ade80'
          : r.state === 'TRAVELLING'
          ? '#38bdf8'
          : r.state === 'CHARGING'
          ? '#f59e0b'
          : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.name.slice(0, 8), x, y + 26);

      // Role Icon / Badge
      ctx.font = '10px Inter';
      const icon =
        r.role === 'WATER_COLLECTOR' ? '💧' :
        r.role === 'PLANTER' ? '🌱' :
        r.role === 'TRANSPORTER' ? '🚚' :
        r.role === 'CLEANER' ? '🧹' : '🤖';
      ctx.fillText(icon, x, y + 4);

      ctx.restore();
    });
  }, [robots, zones, messages]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, minHeight: 380 }}>
      {/* Topology Canvas */}
      <div className="glass" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
              🌐 Cisco-Style Topology Diagram
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
              Live Mesh Active
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {robots.length} Node Mesh
          </span>
        </div>

        <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <canvas
            ref={canvasRef}
            width={480}
            height={320}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>

      {/* Live Robot-to-Robot Chat / Conversation Stream */}
      <div className="glass" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
            💬 Inter-Robot Negotiation & Communication Log
          </span>
          <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>● REAL-TIME CHAT</span>
        </div>

        <div
          ref={logRef}
          style={{
            flex: 1,
            maxHeight: 320,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>
              Assign robots to zones to initiate peer-to-peer communication...
            </div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.035)',
                  borderLeft: `3px solid ${
                    m.badge === 'ALERT' ? '#f59e0b' : m.badge === 'CONFIRM' ? '#4ade80' : '#38bdf8'
                  }`,
                  fontSize: 11.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: '#c7d2fe' }}>
                    {m.fromRobot} ➔ {m.toRobot}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{m.timestamp}</span>
                </div>
                <div style={{ color: '#e2e8f0', lineHeight: 1.45, fontStyle: 'italic' }}>
                  "{m.content}"
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
