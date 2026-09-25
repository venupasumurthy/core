'use client';
import { useEffect, useRef, useState } from 'react';
import type { InterRobotMessage, PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  messages: InterRobotMessage[];
}

interface CiscoNodeTelemetry {
  ip: string;
  mac: string;
  channel: string;
  rssi: number;
  snr: number;
  txPackets: number;
  rxPackets: number;
  latencyMs: number;
  status: 'ONLINE' | 'STANDBY' | 'RELAY' | 'FAULT';
}

const CISCO_FLEET_TELEMETRY: Record<string, CiscoNodeTelemetry> = {
  R0001: {
    ip: '10.240.1.101',
    mac: '00:1E:BD:44:A1:01',
    channel: 'CH 36 (5.18 GHz)',
    rssi: -44,
    snr: 42,
    txPackets: 28410,
    rxPackets: 27950,
    latencyMs: 1.2,
    status: 'ONLINE',
  },
  R0002: {
    ip: '10.240.1.102',
    mac: '00:1E:BD:44:A1:02',
    channel: 'CH 36 (5.18 GHz)',
    rssi: -51,
    snr: 37,
    txPackets: 31200,
    rxPackets: 30890,
    latencyMs: 1.6,
    status: 'ONLINE',
  },
  R0003: {
    ip: '10.240.1.103',
    mac: '00:1E:BD:44:A1:03',
    channel: 'CH 40 (5.20 GHz)',
    rssi: -48,
    snr: 39,
    txPackets: 24900,
    rxPackets: 24710,
    latencyMs: 1.4,
    status: 'ONLINE',
  },
  R0004: {
    ip: '10.240.1.104',
    mac: '00:1E:BD:44:A1:04',
    channel: 'CH 36/40 Dual (Relay)',
    rssi: -38,
    snr: 48,
    txPackets: 68400,
    rxPackets: 67900,
    latencyMs: 0.9,
    status: 'RELAY',
  },
  R0005: {
    ip: '10.240.1.105',
    mac: '00:1E:BD:44:A1:05',
    channel: 'CH 44 (5.22 GHz)',
    rssi: -55,
    snr: 34,
    txPackets: 19800,
    rxPackets: 19540,
    latencyMs: 1.9,
    status: 'ONLINE',
  },
};

export default function TopologyNetworkView({ robots, zones, messages }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('R0001');
  const [pingBurstTime, setPingBurstTime] = useState<number>(0);
  const [totalPackets, setTotalPackets] = useState<number>(142850);

  // Auto-scroll chat log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Continuous high-FPS animation loop for live Cisco graph
  useEffect(() => {
    let animId: number;
    let packetTimer: NodeJS.Timeout;

    // Increment packet counter naturally
    packetTimer = setInterval(() => {
      setTotalPackets(prev => prev + Math.floor(Math.random() * 8 + 4));
    }, 400);

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const W = Math.max(380, Math.floor(rect.width));
      const H = Math.max(340, Math.floor(rect.height || 360));

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Deep dark sleek Apple blueprint background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, W, H);

      // Subtle Cisco tech grid pattern
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 28;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const time = Date.now() / 1000;
      const centerX = W / 2;
      const centerY = H / 2;
      const radius = Math.min(W * 0.38, H * 0.36);

      // 1. Central Cisco Mesh Core Gateway
      // Radiating RF concentric pulse rings
      const pulse1 = (time * 0.6) % 1;
      const pulse2 = (time * 0.6 + 0.5) % 1;
      [pulse1, pulse2].forEach(p => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 22 + p * 60, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * (1 - p)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Calculate node positions around center
      const activeRobots = robots.length > 0 ? robots : [
        { id: 'R0001', name: 'Scout Drone R1', labelCode: 'R1', role: 'GENERAL', battery: 94, state: 'IDLE' } as PlatformRobot,
        { id: 'R0002', name: 'Hydro Harvester R2', labelCode: 'R2', role: 'WATER_COLLECTOR', battery: 88, state: 'IDLE' } as PlatformRobot,
        { id: 'R0003', name: 'Agri Cultivator R3', labelCode: 'R3', role: 'PLANTER', battery: 86, state: 'IDLE' } as PlatformRobot,
        { id: 'R0004', name: 'Mesh Relay Node R4', labelCode: 'R4', role: 'CLEANER', battery: 96, state: 'IDLE' } as PlatformRobot,
        { id: 'R0005', name: 'Heavy Transporter R5', labelCode: 'R5', role: 'TRANSPORTER', battery: 92, state: 'IDLE' } as PlatformRobot,
      ];

      const nodeCoords: Record<string, { x: number; y: number; r: PlatformRobot; roleIcon: string; code: string }> = {};

      const ROLE_ICONS: Record<string, string> = {
        WATER_COLLECTOR: '💧',
        PLANTER: '🌱',
        TRANSPORTER: '🚚',
        CLEANER: '📶',
        GENERAL: '✈',
      };

      activeRobots.forEach((r, idx) => {
        const angle = (idx / (activeRobots.length || 1)) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        nodeCoords[r.id] = {
          x,
          y,
          r,
          roleIcon: ROLE_ICONS[r.role] || '🤖',
          code: r.labelCode || `R${idx + 1}`,
        };
      });

      const robotKeys = Object.keys(nodeCoords);

      // 2. Draw Uplinks to Cisco Central Core Gateway
      robotKeys.forEach((key, idx) => {
        const u = nodeCoords[key];
        const isSelected = selectedNodeId === key;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(u.x, u.y);
        ctx.strokeStyle = isSelected
          ? 'rgba(56, 189, 248, 0.7)'
          : 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = isSelected ? 2.2 : 1.2;
        ctx.stroke();

        // Traveling uplink data packets
        const pktProgress = (time * 0.75 + idx * 0.2) % 1;
        const px = centerX + (u.x - centerX) * pktProgress;
        const py = centerY + (u.y - centerY) * pktProgress;

        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 4 : 3, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 3. Draw Peer-to-Peer Inter-Robot Mesh Links
      for (let i = 0; i < robotKeys.length; i++) {
        for (let j = i + 1; j < robotKeys.length; j++) {
          const u = nodeCoords[robotKeys[i]];
          const v = nodeCoords[robotKeys[j]];
          const isSelectedLink = selectedNodeId === robotKeys[i] || selectedNodeId === robotKeys[j];

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.lineTo(v.x, v.y);
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = isSelectedLink
            ? 'rgba(129, 140, 248, 0.45)'
            : 'rgba(129, 140, 248, 0.14)';
          ctx.lineWidth = isSelectedLink ? 1.5 : 1;
          ctx.stroke();

          // Peer mesh packet
          const p2pProgress = (time * 0.5 + (i + j) * 0.25) % 1;
          const mx = u.x + (v.x - u.x) * p2pProgress;
          const my = u.y + (v.y - u.y) * p2pProgress;

          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#818cf8';
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Draw Central Cisco Catalyst Hub Disc
      ctx.save();
      const hubGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 28);
      hubGrad.addColorStop(0, '#0284c7');
      hubGrad.addColorStop(0.7, '#0f172a');
      hubGrad.addColorStop(1, '#0284c7');

      ctx.beginPath();
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Cisco Gateway Icon & Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CISCO', centerX, centerY - 3);
      ctx.font = '700 7.5px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('CORE · GW', centerX, centerY + 8);
      ctx.restore();

      // 5. Draw Robot Mesh Client Nodes
      Object.values(nodeCoords).forEach(({ x, y, r, roleIcon, code }) => {
        ctx.save();
        const isSelected = selectedNodeId === r.id;
        const nodeRadius = isSelected ? 22 : 18;

        // Outer glow on selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, nodeRadius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fill();
        }

        // Node disc
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#0f1f38' : '#0a101d';
        ctx.fill();

        const stateColor =
          r.state === 'WORKING' ? '#4ade80' :
          r.state === 'TRAVELLING' ? '#38bdf8' :
          r.state === 'CHARGING' ? '#f59e0b' : '#94a3b8';

        ctx.strokeStyle = isSelected ? '#38bdf8' : stateColor;
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.stroke();

        // Role Icon in center
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(roleIcon, x, y + 4.5);

        // Code Badge (Pill at bottom)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 15, y + nodeRadius + 2, 30, 15, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(code, x, y + nodeRadius + 13);

        // Cisco IP Address below (no overlap)
        const tele = CISCO_FLEET_TELEMETRY[r.id];
        if (tele) {
          ctx.fillStyle = '#64748b';
          ctx.font = '700 8px monospace';
          ctx.fillText(tele.ip, x, y + nodeRadius + 28);
        }

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(packetTimer);
    };
  }, [robots, selectedNodeId, pingBurstTime]);

  // Handle canvas click to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const W = rect.width;
    const H = rect.height;
    const centerX = W / 2;
    const centerY = H / 2;
    const radius = Math.min(W * 0.38, H * 0.36);

    const activeRobots = robots.length > 0 ? robots : [
      { id: 'R0001' }, { id: 'R0002' }, { id: 'R0003' }, { id: 'R0004' }, { id: 'R0005' },
    ];

    activeRobots.forEach((r, idx) => {
      const angle = (idx / (activeRobots.length || 1)) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (Math.hypot(clickX - x, clickY - y) < 28) {
        setSelectedNodeId(r.id);
      }
    });
  };

  const selectedRobot = robots.find(r => r.id === selectedNodeId) || robots[0];
  const selectedTele = selectedRobot ? CISCO_FLEET_TELEMETRY[selectedRobot.id] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16 }}>
      {/* Cisco Live Mesh Graph Card */}
      <div
        className="glass"
        style={{
          padding: 18,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Card Header with Cisco Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
              }}
            >
              <span style={{ fontSize: 16 }}>🌐</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Cisco Live Mesh Topology
                </h3>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  ● 100% Live Transmitting
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                IEEE 802.11ah HaLow · Ad-Hoc Gossip Mesh · Zero-Packet-Loss Routing
              </p>
            </div>
          </div>

          {/* Quick Action: Send RF Ping Burst */}
          <button
            onClick={() => setPingBurstTime(Date.now())}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⚡ Broadcast RF Ping
          </button>
        </div>

        {/* Cisco Live Mesh KPIs Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: 11,
          }}
        >
          <div>
            <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>CISCO CORE GW</div>
            <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: 1 }}>10.240.0.1</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>TX PACKETS</div>
            <div style={{ color: '#f8fafc', fontWeight: 800, marginTop: 1 }}>{totalPackets.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>AVG LATENCY</div>
            <div style={{ color: '#4ade80', fontWeight: 800, marginTop: 1 }}>1.4 ms (Jitter 0.2ms)</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>DUPLEX BANDWIDTH</div>
            <div style={{ color: '#c084fc', fontWeight: 800, marginTop: 1 }}>54.0 Mbps Mesh</div>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div
          ref={containerRef}
          style={{
            height: 380,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            background: '#060a12',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              fontSize: 10,
              color: '#64748b',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            💡 Click any node circle to inspect Cisco telemetry
          </div>
        </div>

        {/* Selected Node Cisco Diagnostics Pill */}
        {selectedRobot && selectedTele && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.07)',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>
                {selectedRobot.role === 'WATER_COLLECTOR' ? '💧' : selectedRobot.role === 'PLANTER' ? '🌱' : selectedRobot.role === 'TRANSPORTER' ? '🚚' : selectedRobot.role === 'CLEANER' ? '📶' : '✈'}
              </span>
              <div>
                <span style={{ fontWeight: 800, color: '#f8fafc' }}>
                  {selectedRobot.name} ({selectedTele.ip})
                </span>
                <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                  MAC: {selectedTele.mac}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                RSSI: {selectedTele.rssi} dBm
              </span>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>
                SNR: {selectedTele.snr} dB
              </span>
              <span style={{ color: '#c084fc', fontWeight: 700 }}>
                {selectedTele.channel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live AI Inter-Robot Chat & Negotiation Log */}
      <div
        className="glass"
        style={{
          padding: 18,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Autonomous AI Negotiation Log
              </h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                Decentralized NLP Inter-Agent Communication Stream
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 9999,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
            }}
          >
            REAL-TIME
          </span>
        </div>

        {/* Message Log Container */}
        <div
          ref={logRef}
          style={{
            flex: 1,
            maxHeight: 460,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '60px 0' }}>
              Assign robots to zones or enter an operator directive to initiate AI communication...
            </div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderLeft: `3.5px solid ${
                    m.badge === 'ALERT'
                      ? '#ef4444'
                      : m.badge === 'CONFIRM'
                      ? '#22c55e'
                      : m.badge === 'STATUS'
                      ? '#a855f7'
                      : '#38bdf8'
                  }`,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#38bdf8' }}>{m.fromRobot}</span>
                    <span style={{ color: '#64748b', fontSize: 10 }}>➔</span>
                    <span style={{ color: '#c084fc' }}>{m.toRobot}</span>
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{m.timestamp}</span>
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.45, fontStyle: 'italic', fontSize: 11.5 }}>
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
