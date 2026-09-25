'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChargingStation, RobotData, TaskData } from '@/types/simulation';

const SC: Record<string, string> = {
  IDLE: '#9e9e9e', MOVING: '#2196f3', WORKING: '#4caf50',
  CHARGING: '#ff9800', FAILED: '#e53935',
};

const TYPE_COLORS: Record<string, string> = {
  SCOUT: '#06b6d4',
  TRANSPORTER: '#6366f1',
  HEAVY_LIFTER: '#f59e0b',
};

interface Props {
  robots: RobotData[];
  tasks: TaskData[];
  stations: ChargingStation[];
  worldSize: number;
  selectedRobotId?: string | null;
  onSelectRobot?: (robot: RobotData | null) => void;
}

export default function RobotMap({
  robots,
  tasks,
  stations,
  worldSize,
  selectedRobotId = null,
  onSelectRobot,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [showRoutes, setShowRoutes] = useState(true);

  // Handle canvas click to select robot
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSelectRobot) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const W = canvas.width;
    const H = canvas.height;
    const pad = 24;
    const dw = W - pad * 2;
    const dh = H - pad * 2;

    const tx = (x: number) => pad + (x / worldSize) * dw;
    const ty = (y: number) => H - pad - (y / worldSize) * dh;

    // Find closest robot within 16px radius
    let closest: RobotData | null = null;
    let minDist = 18;

    for (const r of robots) {
      const rx = tx(r.x);
      const ry = ty(r.y);
      const d = Math.hypot(clickX - rx, clickY - ry);
      if (d < minDist) {
        minDist = d;
        closest = r;
      }
    }

    onSelectRobot(closest);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const div = divRef.current;
    if (!canvas || !div) return;

    const sz = Math.max(300, Math.min(div.clientWidth, div.clientHeight) || 600);
    if (canvas.width !== sz) { canvas.width = sz; canvas.height = sz; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = sz, H = sz, pad = 24;
    const dw = W - pad * 2, dh = H - pad * 2;
    const tx = (x: number) => pad + (x / worldSize) * dw;
    const ty = (y: number) => H - pad - (y / worldSize) * dh;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10, 15, 29, 0.65)';
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid with coordinates
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const gx = pad + (i / 10) * dw, gy = pad + (i / 10) * dh;
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
    }

    // Planned Routes / Trajectories (Dashed lines to destination)
    if (showRoutes) {
      robots.forEach(r => {
        if (r.state === 'MOVING' && r.target_x != null && r.target_y != null) {
          const rx = tx(r.x), ry = ty(r.y);
          const gx = tx(r.target_x), gy = ty(r.target_y);

          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(rx, ry);
          ctx.lineTo(gx, gy);
          ctx.strokeStyle = r.yielding_to
            ? 'rgba(245, 158, 11, 0.45)' // Yielding / rerouting
            : r.task_id
            ? 'rgba(99, 102, 241, 0.35)' // Heading to task
            : 'rgba(255, 152, 0, 0.4)';  // Heading to charger
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Charging stations (bays status)
    stations.forEach(s => {
      const [sx, sy] = [tx(s.x), ty(s.y)];
      const cap = s.capacity ?? 4;
      const occ = s.occupied ?? 0;

      // Station footprint
      ctx.fillStyle = 'rgba(88, 28, 135, 0.75)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.fillRect(sx - 12, sy - 12, 24, 24);
      ctx.strokeRect(sx - 12, sy - 12, 24, 24);

      // Station label & occupancy
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.id, sx, sy - 1);

      // Bay status dots
      ctx.font = '8px Inter, sans-serif';
      ctx.fillStyle = occ >= cap ? '#f87171' : '#4ade80';
      ctx.fillText(`${occ}/${cap}`, sx, sy + 8);
    });

    // Tasks (diamonds with priority level)
    tasks.forEach(t => {
      const [px, py] = [tx(t.x), ty(t.y)];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI / 4);

      const isHighPri = t.priority >= 8;
      ctx.fillStyle = t.assigned_to
        ? 'rgba(99, 102, 241, 0.75)'
        : isHighPri
        ? 'rgba(239, 68, 68, 0.65)'
        : 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = t.assigned_to
        ? '#818cf8'
        : isHighPri
        ? '#f87171'
        : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();

      // Show high priority indicator
      if (isHighPri && !t.assigned_to) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`P${t.priority}`, px, py - 9);
      }
    });

    // Robots
    robots.forEach(r => {
      const [rx, ry] = [tx(r.x), ty(r.y)];
      const col = SC[r.state] ?? '#9e9e9e';
      const rtype = r.robot_type ?? 'TRANSPORTER';
      const isSelected = selectedRobotId === r.id;

      // Base radius by heterogeneous type
      let rad = 6;
      if (rtype === 'SCOUT') rad = 5;
      if (rtype === 'HEAVY_LIFTER') rad = 8;
      if (r.state === 'FAILED') rad = 4;

      // Working Glow
      if (r.state === 'WORKING') {
        const g = ctx.createRadialGradient(rx, ry, 2, rx, ry, 16);
        g.addColorStop(0, 'rgba(76, 175, 80, 0.35)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(rx, ry, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moving Glow / Speed Trail
      if (r.state === 'MOVING') {
        ctx.fillStyle = rtype === 'SCOUT' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(33, 150, 243, 0.1)';
        ctx.beginPath();
        ctx.arc(rx, ry, rad + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Yielding / Conflict Warning Ring
      if (r.yielding_to) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(rx, ry, rad + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Heterogeneous Body
      ctx.beginPath();
      if (rtype === 'SCOUT') {
        // Swift triangular badge
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = TYPE_COLORS.SCOUT;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (rtype === 'HEAVY_LIFTER') {
        // Heavy duty reinforced rim
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = TYPE_COLORS.HEAVY_LIFTER;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else {
        // Standard Transporter
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }

      // Battery arc indicator
      if (r.state !== 'FAILED') {
        const a = (r.battery / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(rx, ry, rad + 3, -Math.PI / 2, -Math.PI / 2 + a);
        ctx.strokeStyle = r.battery < 25 ? '#ef4444' : r.battery < 50 ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Red 'X' for failed robot
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rx - 5, ry - 5); ctx.lineTo(rx + 5, ry + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx + 5, ry - 5); ctx.lineTo(rx - 5, ry + 5); ctx.stroke();
      }

      // Selection Reticle if clicked
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const b = rad + 7;
        // 4 corner brackets
        ctx.beginPath();
        ctx.moveTo(rx - b, ry - b + 4); ctx.lineTo(rx - b, ry - b); ctx.lineTo(rx - b + 4, ry - b);
        ctx.moveTo(rx + b - 4, ry - b); ctx.lineTo(rx + b, ry - b); ctx.lineTo(rx + b, ry - b + 4);
        ctx.moveTo(rx - b, ry + b - 4); ctx.lineTo(rx - b, ry + b); ctx.lineTo(rx - b + 4, ry + b);
        ctx.moveTo(rx + b - 4, ry + b); ctx.lineTo(rx + b, ry + b); ctx.lineTo(rx + b, ry + b - 4);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Legend
    const items = Object.entries(SC);
    const lx = W - pad - 120, ly = pad + 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(lx - 6, ly - 6, 126, items.length * 18 + 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(lx - 6, ly - 6, 126, items.length * 18 + 28);

    items.forEach(([st, cl], i) => {
      const iy = ly + i * 18 + 4;
      ctx.beginPath(); ctx.arc(lx + 5, iy, 4, 0, Math.PI * 2);
      ctx.fillStyle = cl; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(st, lx + 14, iy + 3);
    });

    // Heterogeneous note at bottom of legend
    ctx.fillStyle = '#64748b';
    ctx.font = '8.5px Inter, sans-serif';
    ctx.fillText('Scout/Transp/Heavy', lx - 2, ly + items.length * 18 + 14);

  }, [robots, tasks, stations, worldSize, selectedRobotId, showRoutes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          💡 Click any robot to inspect telemetry and inject targeted faults
        </span>
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className="btn btn-ghost"
          style={{
            fontSize: 11,
            padding: '4px 10px',
            background: showRoutes ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid ' + (showRoutes ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
            color: showRoutes ? '#a5b4fc' : '#64748b',
          }}
        >
          {showRoutes ? '✓ Routes Visible' : '✕ Hide Routes'}
        </button>
      </div>

      <div
        ref={divRef}
        style={{
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.07)',
          cursor: 'crosshair',
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
}
