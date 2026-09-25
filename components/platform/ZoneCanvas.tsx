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
  onRecallToCharger?: (robotId: string) => void;
  onSelectRobot: (robot: PlatformRobot) => void;
  onSelectZone: (zone: WorkZone) => void;
  onDeselectAll?: () => void;
  selectedRobotId?: string | null;
  selectedZoneId?: string | null;
  messages?: import('@/types/platform').InterRobotMessage[];
  activeCoordinationTransfer?: {
    transportRobotId: string;
    sourceZoneId: string;
    targetZoneId: string;
    progress: number; // 0 to 1
  } | null;
  deadlockScenario?: {
    robotAId: string;
    robotBId: string;
    zoneName: string;
    step: 'DETECTED' | 'RESOLVING' | 'RESOLVED';
    wfgCycle?: string;
  } | null;
}

const CANVAS_W = 1100;
const CANVAS_H = 950;

export default function ZoneCanvas({
  robots,
  zones,
  messages,
  onZoneCreated,
  onUpdateZone,
  onDeleteZone,
  onAssignRobotToZone,
  onRecallToCharger,
  onSelectRobot,
  onSelectZone,
  onDeselectAll,
  selectedRobotId,
  selectedZoneId,
  activeCoordinationTransfer,
  deadlockScenario,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drawMode, setDrawMode] = useState<'SELECT' | 'DRAW_ZONE'>('SELECT');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrag, setCurrentDrag] = useState<{ x: number; y: number } | null>(null);

  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [isResizingZone, setIsResizingZone] = useState(false);
  const [zoneDragOffset, setZoneDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isOverCharger, setIsOverCharger] = useState(false);

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  // Handle Drag & Drop of robot cards onto canvas zones OR onto Charging Pad Alpha
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dropX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const dropY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    // Detect hover over Charging Pad Alpha (top right corner: x >= CANVAS_W - 220, y <= 150)
    if (dropX >= CANVAS_W - 220 && dropX <= CANVAS_W && dropY >= 10 && dropY <= 150) {
      setIsOverCharger(true);
    } else {
      setIsOverCharger(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverCharger(false);
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { robotId } = JSON.parse(data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dropX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      const dropY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

      // 1. Check if dropped directly onto Charging Pad Alpha
      if (dropX >= CANVAS_W - 220 && dropX <= CANVAS_W && dropY >= 10 && dropY <= 150) {
        if (onRecallToCharger && robotId) {
          onRecallToCharger(robotId);
          return;
        }
      }

      // 2. Find zone that contains drop point
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
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    if (drawMode === 'DRAW_ZONE') {
      setDragStart({ x, y });
      setCurrentDrag({ x, y });
      return;
    }

    // In SELECT mode:
    // 0. Check if clicked directly on Charging Pad Alpha with selected robot
    if (x >= CANVAS_W - 200 && x <= CANVAS_W - 10 && y >= 15 && y <= 140) {
      if (selectedRobotId && onRecallToCharger) {
        onRecallToCharger(selectedRobotId);
        return;
      }
    }

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
    const clickedRobot = robots.find(r => Math.hypot(r.x - x, r.y - y) < 28);
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
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    if (drawMode === 'DRAW_ZONE' && dragStart) {
      setCurrentDrag({ x, y });
    } else if (isResizingZone && selectedZone && onUpdateZone) {
      const newWidth = Math.max(80, Math.min(600, x - selectedZone.x));
      const newHeight = Math.max(60, Math.min(500, y - selectedZone.y));
      onUpdateZone(selectedZone.id, { width: newWidth, height: newHeight });
    } else if (isDraggingZone && selectedZone && onUpdateZone) {
      const newX = Math.max(0, Math.min(CANVAS_W - selectedZone.width, x - zoneDragOffset.x));
      const newY = Math.max(0, Math.min(CANVAS_H - selectedZone.height, y - zoneDragOffset.y));
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
    const newX = Math.max(0, Math.min(CANVAS_W - selectedZone.width, selectedZone.x + dx));
    const newY = Math.max(0, Math.min(CANVAS_H - selectedZone.height, selectedZone.y + dy));
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

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // 1. Ultra-deep tactical navy background
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. High-precision tactical grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Subtle grid coordinate intersection points
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    for (let x = 70; x < CANVAS_W; x += 140) {
      for (let y = 70; y < CANVAS_H; y += 140) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // 3. Subtle Transit Corridors (Walkways connecting zones as in screenshot)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    // Walkway connecting Zone B and Zone C
    ctx.fillRect(660, 390, 80, 50);
    ctx.strokeRect(660, 390, 80, 50);
    ctx.restore();

    // 4. Central Charging Station in Top Right
    ctx.save();
    ctx.fillStyle = isOverCharger ? 'rgba(34, 197, 94, 0.18)' : 'rgba(168, 85, 247, 0.06)';
    ctx.strokeStyle = isOverCharger ? '#22c55e' : 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = isOverCharger ? 2.5 : 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(CANVAS_W - 190, 20, 170, 110);
    ctx.fillRect(CANVAS_W - 190, 20, 170, 110);
    ctx.setLineDash([]);
    ctx.fillStyle = isOverCharger ? '#4ade80' : '#c084fc';
    ctx.font = 'bold 10.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isOverCharger ? '⚡ DROP TO DOCK & RECHARGE' : '⚡ CHARGING PAD ALPHA', CANVAS_W - 105, 45);
    ctx.font = '9.5px Inter';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Drag robot here or click to RTB', CANVAS_W - 105, 65);
    ctx.fillText('+4.0% / tick induction', CANVAS_W - 105, 80);
    ctx.restore();

    // 5. Draw Work Zones with Glowing Dashed Borders
    zones.forEach(z => {
      ctx.save();
      const isSelected = selectedZoneId === z.id;

      // Dashed rectangular border and colored translucent fill
      ctx.setLineDash([6, 5]);
      ctx.fillStyle = `${z.color}0f`; // 6% opacity fill
      ctx.strokeStyle = isSelected ? '#38bdf8' : z.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      ctx.fillRect(z.x, z.y, z.width, z.height);
      ctx.strokeRect(z.x, z.y, z.width, z.height);

      // Zone name in top-left (e.g. "Zone A", "Zone B" in muted tone matching screenshot)
      ctx.setLineDash([]);
      ctx.fillStyle = isSelected ? '#38bdf8' : `${z.color}aa`;
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(z.name, z.x + 12, z.y + 20);

      // Circular Hazard / Debris danger zone inside right half of zone if present
      if (z.hazardText) {
        const cx = z.x + z.width - 60;
        const cy = z.y + 65;
        const hRadius = 36;

        // Red radial danger glow
        const hGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, hRadius);
        hGrad.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
        hGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, hRadius, 0, Math.PI * 2);
        ctx.fill();

        // Red dashed circle border
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, hRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Warning Label
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(z.hazardText, cx, cy + 3);
      }

      // Task Badge Card with Task Symbol and Numbering (Positioned cleanly on left half, no overlap)
      const taskX = z.x + 44;
      const taskY = z.y + 65;
      const taskSymbols: Record<string, string> = {
        Z001: '💧',
        Z002: '⛏️',
        Z003: '🌱',
        Z004: '⚡',
        Z005: '📦',
      };
      const tSymbol = taskSymbols[z.id] || (z.taskType === 'WATER_WASTE' ? '💧' : z.taskType === 'TREE_PLANTING' ? '🌱' : '⚡');
      const tCode = z.taskCode || (z.name.includes('A') ? 'T1' : z.name.includes('B') ? 'T2' : z.name.includes('C') ? 'T3' : z.name.includes('D') ? 'T4' : 'T5');
      const diffLabel = z.difficulty === 'HARD' ? 'High' : z.difficulty === 'EASY' ? 'Low' : 'Medium';

      // Rounded dark badge card
      const badgeW = 48;
      const badgeH = 28;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(taskX - badgeW / 2, taskY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      // Status indicator dot on top of badge
      const taskDotColor =
        z.status === 'COMPLETED' ? '#22c55e' :
        z.status === 'IN_PROGRESS' ? (z.name.includes('A') ? '#06b6d4' : '#f59e0b') :
        z.status === 'OVERDUE' ? '#ef4444' : '#64748b';

      ctx.beginPath();
      ctx.arc(taskX, taskY - badgeH / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = taskDotColor;
      ctx.fill();

      // Task symbol and code text inside badge (e.g. 💧 T1, ⛏️ T2, 🌱 T3)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px Inter, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${tSymbol} ${tCode}`, taskX, taskY + 3.5);

      // Pill label below badge (Medium, High, Critical)
      ctx.font = '9px Inter';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(diffLabel, taskX, taskY + 24);

      // Status / Resource info at bottom
      if (z.resourceProduced) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`${tSymbol} ${z.currentResourceLevel}/${z.resourceProduced.amount} ${z.resourceProduced.type.includes('Water') ? 'L' : z.resourceProduced.type.includes('Power') ? 'Cells' : 'kg'}`, z.x + 12, z.y + z.height - 12);
      } else if (z.resourceRequired) {
        ctx.fillStyle = '#4ade80';
        ctx.font = '9px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`${tSymbol} ${z.currentResourceLevel}/${z.resourceRequired.amount} ${z.resourceRequired.type.includes('Water') ? 'L' : z.resourceRequired.type.includes('Power') ? 'Cells' : 'kg'}`, z.x + 12, z.y + z.height - 12);
      }

      // If Selected: Corner resize handle at bottom right
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

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⤡', hx, hy + 3);
      }

      ctx.restore();
    });

    // 6. Draw Active Resource Transfer Stream between Producer & Consumer
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
        ctx.setLineDash([6, 6]);
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const p = activeCoordinationTransfer.progress;
        const curX = sx + (tx - sx) * p;
        const curY = sy + (ty - sy) * p;

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(curX, curY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8.5px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('💧 500L', curX, curY + 16);
        ctx.restore();
      }
    }

    // 7. Draw Travel Path Lines for moving robots (Vacuum Model)
    robots.forEach(r => {
      if (r.state === 'TRAVELLING' && r.targetX != null && r.targetY != null) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.targetX, r.targetY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    });

    // 7.5 Draw Live Corridor Deadlock Scenario (if active in Mission Control)
    if (deadlockScenario) {
      const rA = robots.find(r => r.id === deadlockScenario.robotAId);
      const rB = robots.find(r => r.id === deadlockScenario.robotBId);

      if (rA && rB) {
        const pulse = (Math.sin(Date.now() / 120) + 1) / 2;

        ctx.save();
        // Pulsing red collision rings around both robots
        [rA, rB].forEach(r => {
          ctx.beginPath();
          ctx.arc(r.x, r.y, 28 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.5})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        });

        // Bidirectional deadlock lock line
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.moveTo(rA.x, rA.y);
        ctx.lineTo(rB.x, rB.y);
        ctx.strokeStyle = deadlockScenario.step === 'RESOLVED' ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Deadlock HUD Badge between them
        const midX = (rA.x + rB.x) / 2;
        const midY = (rA.y + rB.y) / 2 - 25;
        const badgeText =
          deadlockScenario.step === 'DETECTED'
            ? '⚠️ WFG CYCLE: R1 ↔ R2 DEADLOCK'
            : deadlockScenario.step === 'RESOLVING'
            ? '🔄 AI DETOUR: R2 YIELDING RoW'
            : '✅ DEADLOCK RESOLVED: CORRIDOR CLEAR';

        const bw = 210;
        ctx.fillStyle = deadlockScenario.step === 'RESOLVED' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - bw / 2, midY - 13, bw, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, midX, midY + 4);

        // If in resolving phase: draw the 90° lateral back-off detour trajectory to clearance pocket
        if (deadlockScenario.step === 'RESOLVING') {
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(rB.x, rB.y);
          ctx.lineTo(580, 330);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(580, 330, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8.5px Inter';
          ctx.fillText('Clearance Pocket', 580, 318);
        }

        ctx.restore();
      }
    }

    // 8. Draw Robots matching Tactical Screenshot (Radio circles, dark nodes, battery pill, labels)
    robots.forEach((r, idx) => {
      ctx.save();
      const isSelected = selectedRobotId === r.id;
      const rRadius = r.radioRadius || 85;

      // A. Large Translucent Radio Comms / Sensor Coverage Circle
      const radGrad = ctx.createRadialGradient(r.x, r.y, 10, r.x, r.y, rRadius);
      radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      radGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.03)');
      radGrad.addColorStop(1, 'rgba(56, 189, 248, 0.005)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rRadius, 0, Math.PI * 2);
      ctx.stroke();

      // B. Robot Disc Node
      ctx.beginPath();
      ctx.arc(r.x, r.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // C. Role Icon inside robot disc
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '12px sans-serif';
      let icon = '✈';
      if (r.id === 'R0001' || r.role === 'GENERAL') icon = '✈';
      else if (r.id === 'R0002' || r.role === 'WATER_COLLECTOR') icon = '💧';
      else if (r.id === 'R0003' || r.role === 'PLANTER') icon = '🌱';
      else if (r.id === 'R0004' || r.role === 'CLEANER') icon = '📶';
      else if (r.id === 'R0005' || r.role === 'TRANSPORTER') icon = '🚚';
      ctx.fillText(icon, r.x, r.y + 4.5);

      // D. Battery Pill Badge (Top-Right)
      const batPillX = r.x + 13;
      const batPillY = r.y - 14;
      const batColor = r.battery < 25 ? '#ef4444' : r.battery < 50 ? '#f59e0b' : '#10b981';

      ctx.fillStyle = batColor;
      ctx.beginPath();
      ctx.arc(batPillX, batPillY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${r.battery.toFixed(0)}`, batPillX, batPillY + 3);

      // E. Robot ID Badge Card underneath with clear numbering (R1, R2, R3...)
      const labelText = r.labelCode || `R${idx + 1}`;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(r.x - 16, r.y + 24, 32, 17, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, r.x, r.y + 36);

      // Reticle if selected
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        const sz = 26;
        ctx.beginPath();
        ctx.moveTo(r.x - sz, r.y - sz + 6); ctx.lineTo(r.x - sz, r.y - sz); ctx.lineTo(r.x - sz + 6, r.y - sz);
        ctx.moveTo(r.x + sz - 6, r.y - sz); ctx.lineTo(r.x + sz, r.y - sz); ctx.lineTo(r.x + sz, r.y - sz + 6);
        ctx.moveTo(r.x - sz, r.y + sz - 6); ctx.lineTo(r.x - sz, r.y + sz); ctx.lineTo(r.x - sz + 6, r.y + sz);
        ctx.moveTo(r.x + sz - 6, r.y + sz); ctx.lineTo(r.x + sz, r.y + sz); ctx.lineTo(r.x + sz, r.y + sz - 6);
        ctx.stroke();
      }

      // F. Floating AI Speech Bubble above active speaking robot
      if (messages && messages.length > 0) {
        const latestMsg = [...messages].reverse().find(m =>
          m.fromRobot === r.name || m.fromRobot.includes(r.name) || r.name.includes(m.fromRobot)
        );

        if (latestMsg) {
          const bubbleText = latestMsg.content.length > 36 ? latestMsg.content.slice(0, 34) + '...' : latestMsg.content;
          const bw = Math.min(200, Math.max(90, bubbleText.length * 5.8 + 18));
          const bh = 22;
          const bx = r.x - bw / 2;
          const by = r.y - 48;

          ctx.fillStyle = 'rgba(10, 16, 26, 0.94)';
          ctx.strokeStyle = latestMsg.badge === 'ALERT' ? '#f59e0b' : '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 6);
          ctx.fill();
          ctx.stroke();

          // Pointer down to robot node
          ctx.beginPath();
          ctx.moveTo(r.x - 4, by + bh);
          ctx.lineTo(r.x, by + bh + 5);
          ctx.lineTo(r.x + 4, by + bh);
          ctx.fillStyle = 'rgba(10, 16, 26, 0.94)';
          ctx.fill();

          ctx.fillStyle = '#f1f5f9';
          ctx.font = '500 8.5px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(bubbleText, r.x, by + 14);
        }
      }

      ctx.restore();
    });

    // 9. Floating Tactical LEGEND Box in Top-Left (Exact replica of user screenshot)
    ctx.save();
    const legX = 24;
    const legY = 24;
    const legW = 125;
    const legH = 175;

    // Dark glass box
    ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legX, legY, legW, legH, 10);
    ctx.fill();
    ctx.stroke();

    // Legend Header
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LEGEND', legX + 14, legY + 22);

    // Legend Items
    const legendItems = [
      { label: 'IDLE', color: '#64748b' },
      { label: 'MOVING', color: '#06b6d4' },
      { label: 'ON_TASK', color: '#10b981' },
      { label: 'NEGOTIATING', color: '#f59e0b' },
      { label: 'OFFLINE', color: '#ef4444' },
      { label: 'CHARGING', color: '#a855f7' },
    ];

    legendItems.forEach((item, i) => {
      const itemY = legY + 44 + i * 22;
      ctx.beginPath();
      ctx.arc(legX + 18, itemY - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9.5px Inter, sans-serif';
      ctx.fillText(item.label, legX + 30, itemY);
    });
    ctx.restore();

    // 10. Active Zone Drawing Preview
    if (drawMode === 'DRAW_ZONE' && dragStart && currentDrag) {
      const minX = Math.min(dragStart.x, currentDrag.x);
      const minY = Math.min(dragStart.y, currentDrag.y);
      const width = Math.abs(currentDrag.x - dragStart.x);
      const height = Math.abs(currentDrag.y - dragStart.y);

      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);
      ctx.restore();
    }
  }, [robots, zones, drawMode, dragStart, currentDrag, selectedRobotId, selectedZoneId, activeCoordinationTransfer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setDrawMode('SELECT')}
            className={`btn ${drawMode === 'SELECT' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              width: 'auto',
              padding: '7px 16px',
              fontSize: 12,
              borderRadius: 9999,
            }}
          >
            👆 Select / Move / Resize
          </button>
          <button
            onClick={() => setDrawMode('DRAW_ZONE')}
            className={`btn ${drawMode === 'DRAW_ZONE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              width: 'auto',
              padding: '7px 16px',
              fontSize: 12,
              borderRadius: 9999,
            }}
          >
            ✏️ Draw Work Zone (Click & Drag)
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 14 }}>
          <span>📦 Drag robot onto zone to assign</span>
          <span>⚡ Charging Pad Alpha in top-right</span>
          <span>🛰️ RF radio radius active</span>
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
                className="btn btn-danger"
                style={{
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 8,
                  width: 'auto',
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
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          borderRadius: 16,
          overflow: 'hidden',
          background: '#060911',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
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
