'use client';
import { useEffect, useRef, useState } from 'react';
import type { PlatformRobot, WorkZone } from '@/types/platform';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  onZoneCreated: (draft: { x: number; y: number; width: number; height: number }) => void;
  onUpdateZone?: (zoneId: string, updates: Partial<WorkZone>) => void;
  onDeleteZone?: (zoneId: string) => void;
  onAssignRobotToZone: (robotId: string, zoneId: string) => void;
  onSelectRobot: (robot: PlatformRobot) => void;
  onSelectZone: (zone: WorkZone) => void;
  onDeselectAll?: () => void;
  selectedRobotId?: string | null;
  selectedZoneId?: string | null;
  activeCoordinationTransfer?: {
    transportRobotId: string;
    sourceZoneId: string;
    targetZoneId: string;
    progress: number; // 0 to 1
  } | null;
}

export default function ZoneCanvas({
  robots,
  zones,
  onZoneCreated,
  onUpdateZone,
  onDeleteZone,
  onAssignRobotToZone,
  onSelectRobot,
  onSelectZone,
  onDeselectAll,
  selectedRobotId,
  selectedZoneId,
  activeCoordinationTransfer,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drawMode, setDrawMode] = useState<'SELECT' | 'DRAW_ZONE'>('SELECT');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrag, setCurrentDrag] = useState<{ x: number; y: number } | null>(null);

  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [isResizingZone, setIsResizingZone] = useState(false);
  const [zoneDragOffset, setZoneDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  // Handle Drag & Drop of robot cards onto canvas zones
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { robotId } = JSON.parse(data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dropX = ((e.clientX - rect.left) / rect.width) * 1000;
      const dropY = ((e.clientY - rect.top) / rect.height) * 800;

      // Find zone that contains drop point
      const targetZone = zones.find(
        z => dropX >= z.x && dropX <= z.x + z.width && dropY >= z.y && dropY <= z.y + z.height
      );

      if (targetZone && robotId) {
        onAssignRobotToZone(robotId, targetZone.id);
      }
    } catch {
      // ignore
    }
  };

  // Canvas Mouse Events for Zone Drawing, Selection, Moving & Resizing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    if (drawMode === 'DRAW_ZONE') {
      setDragStart({ x, y });
      setCurrentDrag({ x, y });
      return;
    }

    // In SELECT mode:
    // 1. Check if clicked on resize handle of currently selected zone (bottom right corner)
    if (selectedZone) {
      const handleX = selectedZone.x + selectedZone.width;
      const handleY = selectedZone.y + selectedZone.height;
      if (Math.hypot(x - handleX, y - handleY) <= 16) {
        setIsResizingZone(true);
        return;
      }
    }

    // 2. Check if clicked on a robot
    const clickedRobot = robots.find(r => Math.hypot(r.x - x, r.y - y) < 24);
    if (clickedRobot) {
      onSelectRobot(clickedRobot);
      return;
    }

    // 3. Check if clicked on a zone
    const clickedZone = zones.find(
      z => x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height
    );
    if (clickedZone) {
      onSelectZone(clickedZone);
      setIsDraggingZone(true);
      setZoneDragOffset({ x: x - clickedZone.x, y: y - clickedZone.y });
    } else {
      if (onDeselectAll) onDeselectAll();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    if (drawMode === 'DRAW_ZONE' && dragStart) {
      setCurrentDrag({ x, y });
    } else if (isResizingZone && selectedZone && onUpdateZone) {
      const newWidth = Math.max(80, Math.min(600, x - selectedZone.x));
      const newHeight = Math.max(60, Math.min(500, y - selectedZone.y));
      onUpdateZone(selectedZone.id, { width: newWidth, height: newHeight });
    } else if (isDraggingZone && selectedZone && onUpdateZone) {
      const newX = Math.max(0, Math.min(1000 - selectedZone.width, x - zoneDragOffset.x));
      const newY = Math.max(0, Math.min(800 - selectedZone.height, y - zoneDragOffset.y));
      onUpdateZone(selectedZone.id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (drawMode === 'DRAW_ZONE' && dragStart && currentDrag) {
      const minX = Math.min(dragStart.x, currentDrag.x);
      const minY = Math.min(dragStart.y, currentDrag.y);
      const width = Math.abs(currentDrag.x - dragStart.x);
      const height = Math.abs(currentDrag.y - dragStart.y);

      if (width > 40 && height > 40) {
        onZoneCreated({ x: minX, y: minY, width, height });
        setDrawMode('SELECT');
      }
      setDragStart(null);
      setCurrentDrag(null);
    }

    setIsDraggingZone(false);
    setIsResizingZone(false);
  };

  // Nudge Move Zone Helpers
  const handleNudge = (dx: number, dy: number) => {
    if (!selectedZone || !onUpdateZone) return;
    const newX = Math.max(0, Math.min(1000 - selectedZone.width, selectedZone.x + dx));
    const newY = Math.max(0, Math.min(800 - selectedZone.height, selectedZone.y + dy));
    onUpdateZone(selectedZone.id, { x: newX, y: newY });
  };

  // Resize Zone Helpers
  const handleDeltaResize = (dw: number, dh: number) => {
    if (!selectedZone || !onUpdateZone) return;
    const newW = Math.max(80, Math.min(700, selectedZone.width + dw));
    const newH = Math.max(60, Math.min(600, selectedZone.height + dh));
    onUpdateZone(selectedZone.id, { width: newW, height: newH });
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 800;

    const W = 1000;
    const H = 800;

    // Industrial floor background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Grid tiles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Charging Station Area (Top Right)
    ctx.save();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(820, 20, 160, 120);
    ctx.fillRect(820, 20, 160, 120);
    ctx.setLineDash([]);
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ CENTRAL CHARGING BAY', 900, 45);
    ctx.font = '10px Inter';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Automatic Return ≤20% Bat', 900, 65);
    ctx.fillText('4 High-Speed Induction Pads', 900, 80);
    ctx.restore();

    // Draw Work Zones
    zones.forEach(z => {
      ctx.save();
      const isSelected = selectedZoneId === z.id;

      // Zone background & border
      ctx.fillStyle = z.status === 'COMPLETED'
        ? 'rgba(34, 197, 94, 0.12)'
        : z.status === 'OVERDUE'
        ? 'rgba(239, 68, 68, 0.15)'
        : z.status === 'IN_PROGRESS'
        ? 'rgba(56, 189, 248, 0.12)'
        : 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = isSelected ? '#38bdf8' : z.color;
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.fillRect(z.x, z.y, z.width, z.height);
      ctx.strokeRect(z.x, z.y, z.width, z.height);

      // Zone Header Badge
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.width, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(z.name, z.x + 8, z.y + 16);

      // Task Type & Difficulty
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`Task: ${z.taskType}`, z.x + 8, z.y + 40);
      ctx.fillText(`Hardness: ${z.difficulty}`, z.x + 8, z.y + 54);

      if (z.resourceProduced) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Produces: ${z.resourceProduced.amount}L ${z.resourceProduced.type}`, z.x + 8, z.y + 68);
      } else if (z.resourceRequired) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`Requires: ${z.resourceRequired.amount}L ${z.resourceRequired.type}`, z.x + 8, z.y + 68);
      }

      // Status Badge
      const statusColor =
        z.status === 'COMPLETED' ? '#22c55e' :
        z.status === 'OVERDUE' ? '#ef4444' :
        z.status === 'IN_PROGRESS' ? '#38bdf8' :
        z.status === 'ASSIGNED' ? '#818cf8' : '#64748b';

      ctx.fillStyle = statusColor;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`● ${z.status}`, z.x + 8, z.y + z.height - 12);

      // Live Countdown Timer if Working
      if (z.status === 'IN_PROGRESS') {
        ctx.fillStyle = z.timeRemainingSeconds < 10 ? '#ef4444' : '#38bdf8';
        ctx.textAlign = 'right';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`⏱ ${z.timeRemainingSeconds}s`, z.x + z.width - 8, z.y + z.height - 12);
      }

      // If Selected: Draw Corner Resize Handle at bottom right
      if (isSelected) {
        const hx = z.x + z.width;
        const hy = z.y + z.height;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(hx, hy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Corner drag helper icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⤡', hx, hy + 3);
      }

      ctx.restore();
    });

    // Draw Active Resource Transfer Stream between Producer & Consumer
    if (activeCoordinationTransfer) {
      const src = zones.find(z => z.id === activeCoordinationTransfer.sourceZoneId);
      const tgt = zones.find(z => z.id === activeCoordinationTransfer.targetZoneId);
      if (src && tgt) {
        const sx = src.x + src.width / 2;
        const sy = src.y + src.height / 2;
        const tx = tgt.x + tgt.width / 2;
        const ty = tgt.y + tgt.height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([8, 8]);
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pulsing water package along the beam
        const p = activeCoordinationTransfer.progress;
        const curX = sx + (tx - sx) * p;
        const curY = sy + (ty - sy) * p;

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('💧 500L', curX, curY + 16);
        ctx.restore();
      }
    }

    // Draw Travel Path Lines for moving robots (Vacuum Model)
    robots.forEach(r => {
      if (r.state === 'TRAVELLING' && r.targetX != null && r.targetY != null) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.targetX, r.targetY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw Robots
    robots.forEach(r => {
      ctx.save();
      const isSelected = selectedRobotId === r.id;

      // Glow when working
      if (r.state === 'WORKING') {
        const g = ctx.createRadialGradient(r.x, r.y, 4, r.x, r.y, 22);
        g.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Robot Vacuum Disc Body
      ctx.beginPath();
      ctx.arc(r.x, r.y, 14, 0, Math.PI * 2);
      ctx.fillStyle =
        r.state === 'FAILED' ? '#ef4444' :
        r.state === 'WORKING' ? '#22c55e' :
        r.state === 'CHARGING' ? '#f59e0b' :
        r.state === 'TRAVELLING' ? '#38bdf8' : '#334155';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : '#64748b';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Battery ring arc
      const bAngle = (r.battery / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 18, -Math.PI / 2, -Math.PI / 2 + bAngle);
      ctx.strokeStyle = r.battery < 25 ? '#ef4444' : r.battery < 50 ? '#f59e0b' : '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Name & Role label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.name, r.x, r.y + 28);

      // Icon on robot body
      ctx.font = '11px Inter';
      const roleIcon =
        r.role === 'WATER_COLLECTOR' ? '💧' :
        r.role === 'PLANTER' ? '🌱' :
        r.role === 'TRANSPORTER' ? '🚚' :
        r.role === 'CLEANER' ? '🧹' : '🤖';
      ctx.fillText(roleIcon, r.x, r.y + 4);

      // Reticle if selected
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const sz = 24;
        ctx.beginPath();
        ctx.moveTo(r.x - sz, r.y - sz + 6); ctx.lineTo(r.x - sz, r.y - sz); ctx.lineTo(r.x - sz + 6, r.y - sz);
        ctx.moveTo(r.x + sz - 6, r.y - sz); ctx.lineTo(r.x + sz, r.y - sz); ctx.lineTo(r.x + sz, r.y - sz + 6);
        ctx.moveTo(r.x - sz, r.y + sz - 6); ctx.lineTo(r.x - sz, r.y + sz); ctx.lineTo(r.x - sz + 6, r.y + sz);
        ctx.moveTo(r.x + sz - 6, r.y + sz); ctx.lineTo(r.x + sz, r.y + sz); ctx.lineTo(r.x + sz, r.y + sz - 6);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw active drag rectangle preview if drawing zone
    if (drawMode === 'DRAW_ZONE' && dragStart && currentDrag) {
      const minX = Math.min(dragStart.x, currentDrag.x);
      const minY = Math.min(dragStart.y, currentDrag.y);
      const width = Math.abs(currentDrag.x - dragStart.x);
      const height = Math.abs(currentDrag.y - dragStart.y);

      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);
      ctx.restore();
    }
  }, [robots, zones, drawMode, dragStart, currentDrag, selectedRobotId, selectedZoneId, activeCoordinationTransfer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setDrawMode('SELECT')}
            className="btn"
            style={{
              width: 'auto',
              padding: '6px 14px',
              fontSize: 12,
              background: drawMode === 'SELECT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${drawMode === 'SELECT' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              color: drawMode === 'SELECT' ? '#c7d2fe' : '#94a3b8',
            }}
          >
            👆 Select / Move / Resize
          </button>
          <button
            onClick={() => setDrawMode('DRAW_ZONE')}
            className="btn"
            style={{
              width: 'auto',
              padding: '6px 14px',
              fontSize: 12,
              background: drawMode === 'DRAW_ZONE' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${drawMode === 'DRAW_ZONE' ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)'}`,
              color: drawMode === 'DRAW_ZONE' ? '#67e8f9' : '#94a3b8',
            }}
          >
            ✏️ Draw Work Zone (Click & Drag)
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 12 }}>
          <span>📦 Drag robot onto zone to assign</span>
          <span>⚡ Charging Bay in top-right</span>
        </div>
      </div>

      {/* Selected Zone Controls Bar */}
      {selectedZone && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>Selected Zone:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedZone.name}</span>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
              {selectedZone.taskType} ({selectedZone.width}×{selectedZone.height}px)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Move Controls */}
            <span style={{ fontSize: 10, color: '#64748b' }}>Move:</span>
            <button onClick={() => handleNudge(-20, 0)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>◀</button>
            <button onClick={() => handleNudge(20, 0)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>▶</button>
            <button onClick={() => handleNudge(0, -20)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>▲</button>
            <button onClick={() => handleNudge(0, 20)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>▼</button>

            {/* Resize Controls */}
            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>Size:</span>
            <button onClick={() => handleDeltaResize(20, 15)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>+ Expand</button>
            <button onClick={() => handleDeltaResize(-20, -15)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11, width: 'auto' }}>- Shrink</button>

            {/* Delete Zone Button */}
            {onDeleteZone && (
              <button
                onClick={() => onDeleteZone(selectedZone.id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 8,
                }}
              >
                🗑️ Delete Zone
              </button>
            )}
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: '100%',
          aspectRatio: '10 / 8',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#0a0e1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          cursor: drawMode === 'DRAW_ZONE' ? 'crosshair' : isDraggingZone ? 'grabbing' : 'default',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
}
