'use client';
import { useEffect, useState, useRef } from 'react';
import type {
  PlatformRobot,
  WorkZone,
  CoordinationAlert,
  InterRobotMessage,
} from '@/types/platform';
import AuthModal from '@/components/platform/AuthModal';
import OnboardingModal from '@/components/platform/OnboardingModal';
import CreateRobotModal from '@/components/platform/CreateRobotModal';
import ZoneFormModal from '@/components/platform/ZoneFormModal';
import CoordinationPromptModal from '@/components/platform/CoordinationPromptModal';
import LowBatteryPromptModal from '@/components/platform/LowBatteryPromptModal';
import ZoneCanvas from '@/components/platform/ZoneCanvas';
import FleetSidebar from '@/components/platform/FleetSidebar';
import TopologyNetworkView from '@/components/platform/TopologyNetworkView';
import FleetOverviewBar from '@/components/platform/FleetOverviewBar';
import Link from 'next/link';

// Initial pre-configured seed robots
const INITIAL_ROBOTS: PlatformRobot[] = [
  {
    id: 'R0001',
    name: 'AquaCollector-1',
    role: 'WATER_COLLECTOR',
    battery: 92,
    health: 98,
    speed: 3.8,
    capacity: 100,
    currentLoad: 0,
    state: 'IDLE',
    x: 100,
    y: 120,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0002',
    name: 'TerraPlanter-2',
    role: 'PLANTER',
    battery: 88,
    health: 95,
    speed: 3.2,
    capacity: 80,
    currentLoad: 0,
    state: 'IDLE',
    x: 150,
    y: 120,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0003',
    name: 'SwiftTrans-3',
    role: 'TRANSPORTER',
    battery: 100,
    health: 100,
    speed: 5.2,
    capacity: 150,
    currentLoad: 0,
    state: 'IDLE',
    x: 200,
    y: 120,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0004',
    name: 'Sanitizer-4',
    role: 'CLEANER',
    battery: 84,
    health: 90,
    speed: 4.0,
    capacity: 50,
    currentLoad: 0,
    state: 'IDLE',
    x: 250,
    y: 120,
    workProgress: 0,
    workTimeRemaining: 0,
  },
];

// Initial pre-configured seed zones
const INITIAL_ZONES: WorkZone[] = [
  {
    id: 'Z001',
    name: 'Zone Alpha - Water Treatment',
    x: 80,
    y: 280,
    width: 280,
    height: 220,
    color: '#0284c7',
    taskType: 'WATER_WASTE',
    difficulty: 'MEDIUM',
    timeLimitSeconds: 50,
    timeRemainingSeconds: 50,
    resourceProduced: { type: 'Purified Water', amount: 500 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
  {
    id: 'Z002',
    name: 'Zone Beta - Arborist Field',
    x: 580,
    y: 380,
    width: 320,
    height: 240,
    color: '#16a34a',
    taskType: 'TREE_PLANTING',
    difficulty: 'HARD',
    timeLimitSeconds: 70,
    timeRemainingSeconds: 70,
    resourceRequired: { type: 'Purified Water', amount: 500 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
];

export default function PlatformPage() {
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreateRobotOpen, setIsCreateRobotOpen] = useState(false);
  const [zoneDraft, setZoneDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [robots, setRobots] = useState<PlatformRobot[]>(INITIAL_ROBOTS);
  const [zones, setZones] = useState<WorkZone[]>(INITIAL_ZONES);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MAP' | 'TOPOLOGY'>('MAP');

  const [coordinationAlert, setCoordinationAlert] = useState<CoordinationAlert | null>(null);
  const [lowBatteryAlert, setLowBatteryAlert] = useState<{ robot: PlatformRobot; zone: WorkZone } | null>(null);

  const [messages, setMessages] = useState<InterRobotMessage[]>([
    {
      id: 'm-1',
      timestamp: '14:28:10',
      fromRobot: 'Dispatch',
      toRobot: 'Fleet',
      content: 'Multi-Robot Zone Coordination System online. Standing by for zone assignments.',
      badge: 'STATUS',
    },
  ]);

  const [transferState, setTransferState] = useState<{
    transportRobotId: string;
    sourceZoneId: string;
    targetZoneId: string;
    progress: number;
    phase: 'PICKUP' | 'DELIVERY';
  } | null>(null);

  // Authentication Completion
  const handleLogin = (name: string) => {
    setOperatorName(name);
    setIsAuthOpen(false);
    setIsOnboardingOpen(true); // Show onboarding mascot after login as required
  };

  // Add Log Message Helper
  const addMessage = (from: string, to: string, content: string, badge: 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT' = 'LOGISTICS') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setMessages(prev => [
      ...prev,
      { id: 'm-' + Date.now() + Math.random(), timestamp: timeStr, fromRobot: from, toRobot: to, content, badge },
    ]);
  };

  // Assign Robot to Zone (via Drag & Drop)
  const handleAssignRobotToZone = (robotId: string, zoneId: string) => {
    const robot = robots.find(r => r.id === robotId);
    const zone = zones.find(z => z.id === zoneId);
    if (!robot || !zone) return;

    if (robot.state !== 'IDLE') {
      alert(`${robot.name} is currently ${robot.state.toLowerCase()}! Select an idle robot.`);
      return;
    }

    const targetCenterX = zone.x + zone.width / 2;
    const targetCenterY = zone.y + zone.height / 2;

    // Update Robot
    setRobots(prev =>
      prev.map(r =>
        r.id === robotId
          ? {
              ...r,
              state: 'TRAVELLING',
              assignedZoneId: zoneId,
              targetX: targetCenterX,
              targetY: targetCenterY,
              workProgress: 0,
              workTimeRemaining: zone.timeLimitSeconds,
            }
          : r
      )
    );

    // Update Zone
    setZones(prev =>
      prev.map(z =>
        z.id === zoneId
          ? { ...z, status: 'ASSIGNED', assignedRobotId: robotId }
          : z
      )
    );

    addMessage(robot.name, 'Dispatch', `Dispatched to ${zone.name}. En route to target coordinates.`, 'STATUS');
  };

  // Recall to Charging Station
  const handleRecallToCharger = (robotId: string) => {
    setRobots(prev =>
      prev.map(r => {
        if (r.id === robotId) {
          addMessage(r.name, 'Charging Station', 'Initiated return to Central Charging Bay.', 'STATUS');
          return {
            ...r,
            state: 'TRAVELLING',
            targetX: 900,
            targetY: 80,
            assignedZoneId: null,
          };
        }
        return r;
      })
    );
    if (lowBatteryAlert?.robot.id === robotId) {
      setLowBatteryAlert(null);
    }
  };

  // Dispatch Replacement Robot
  const handleDispatchReplacement = (replacementRobotId: string, zoneId: string) => {
    if (lowBatteryAlert) {
      handleRecallToCharger(lowBatteryAlert.robot.id);
    }
    handleAssignRobotToZone(replacementRobotId, zoneId);
    setLowBatteryAlert(null);
    addMessage('Dispatch', 'Fleet', 'Replacement robot deployed. Operations resuming in work zone.', 'STATUS');
  };

  // Assign Transport Robot for Producer/Consumer Coordination
  const handleAssignTransport = (transportRobotId: string) => {
    if (!coordinationAlert) return;

    const sourceZone = zones.find(z => z.id === coordinationAlert.sourceZoneId);
    const targetZone = zones.find(z => z.id === coordinationAlert.targetZoneId);
    const transporter = robots.find(r => r.id === transportRobotId);

    if (!sourceZone || !targetZone || !transporter) return;

    // Start pickup phase
    setRobots(prev =>
      prev.map(r =>
        r.id === transportRobotId
          ? {
              ...r,
              state: 'TRAVELLING',
              targetX: sourceZone.x + sourceZone.width / 2,
              targetY: sourceZone.y + sourceZone.height / 2,
            }
          : r
      )
    );

    setTransferState({
      transportRobotId,
      sourceZoneId: sourceZone.id,
      targetZoneId: targetZone.id,
      progress: 0,
      phase: 'PICKUP',
    });

    addMessage(
      transporter.name,
      'AquaCollector-1',
      `Acknowledged coordination request. En route to ${sourceZone.name} to collect 500L water waste.`,
      'LOGISTICS'
    );

    setCoordinationAlert(null);
  };

  // Zone Update & Delete Handlers
  const handleUpdateZone = (zoneId: string, updates: Partial<WorkZone>) => {
    setZones(prev => prev.map(z => (z.id === zoneId ? { ...z, ...updates } : z)));
  };

  const handleDeleteZone = (zoneId: string) => {
    const zoneToDelete = zones.find(z => z.id === zoneId);
    setZones(prev => prev.filter(z => z.id !== zoneId));
    // If a robot was assigned to this zone, set back to IDLE
    setRobots(prev =>
      prev.map(r => (r.assignedZoneId === zoneId ? { ...r, state: 'IDLE', assignedZoneId: null, workProgress: 0 } : r))
    );
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
    addMessage('Dispatch', 'Fleet', `Work zone "${zoneToDelete?.name || zoneId}" deleted by operator.`, 'STATUS');
  };

  // Simulation Loop (Continuous Physical Travel, Work Countdown, Dependency Detection)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Robots Physics & Travel
      setRobots(prevRobots => {
        return prevRobots.map(robot => {
          let updated = { ...robot };

          // Movement toward target (Vacuum Model - physical steps)
          if (updated.state === 'TRAVELLING' && updated.targetX != null && updated.targetY != null) {
            const dx = updated.targetX - updated.x;
            const dy = updated.targetY - updated.y;
            const dist = Math.hypot(dx, dy);
            const step = updated.speed * 4;

            if (dist <= step) {
              updated.x = updated.targetX;
              updated.y = updated.targetY;
              updated.targetX = null;
              updated.targetY = null;

              // Check if arrived at charging bay
              if (updated.x >= 820 && updated.y <= 140) {
                updated.state = 'CHARGING';
                addMessage(updated.name, 'Dispatch', 'Docked at Central Charging Bay. Recharging cells.', 'STATUS');
              } else if (updated.assignedZoneId) {
                updated.state = 'WORKING';
                addMessage(updated.name, 'Dispatch', 'Arrived at work zone. Initiating operations.', 'STATUS');
              }
            } else {
              updated.x += (dx / dist) * step;
              updated.y += (dy / dist) * step;
              updated.battery = Math.max(0, updated.battery - 0.08);
            }
          }

          // Working on Zone
          else if (updated.state === 'WORKING' && updated.assignedZoneId) {
            const zone = zones.find(z => z.id === updated.assignedZoneId);
            const drainRate = zone?.difficulty === 'HARD' ? 0.35 : zone?.difficulty === 'MEDIUM' ? 0.2 : 0.1;
            const healthDegrade = zone?.difficulty === 'HARD' ? 0.08 : 0.03;

            updated.battery = Math.max(0, updated.battery - drainRate);
            updated.health = Math.max(0, updated.health - healthDegrade);
            updated.workProgress = Math.min(100, updated.workProgress + 2.5);

            // Trigger Low Battery Intervention Prompt below 20%
            if (updated.battery <= 20 && !lowBatteryAlert && zone) {
              updated.state = 'IDLE'; // pause task
              setLowBatteryAlert({ robot: updated, zone });
              addMessage(
                updated.name,
                'Dispatch',
                `LOW BATTERY (${updated.battery.toFixed(0)}%). Task paused in ${zone.name}. Awaiting intervention.`,
                'ALERT'
              );
            }

            // Task Completed
            if (updated.workProgress >= 100) {
              updated.state = 'IDLE';
              updated.workProgress = 100;
              addMessage(updated.name, 'Dispatch', 'Work order completed successfully. Returning to standby.', 'CONFIRM');
            }
          }

          // Charging at Station
          else if (updated.state === 'CHARGING') {
            updated.battery = Math.min(100, updated.battery + 4.0);
            updated.health = Math.min(100, updated.health + 1.0);
            if (updated.battery >= 99.5) {
              updated.state = 'IDLE';
              addMessage(updated.name, 'Dispatch', 'Battery at 100%. Ready for next deployment.', 'CONFIRM');
            }
          }

          return updated;
        });
      });

      // 2. Update Work Zones status & time limits
      setZones(prevZones => {
        return prevZones.map(zone => {
          if (zone.status === 'ASSIGNED') {
            const assignedBot = robots.find(r => r.id === zone.assignedRobotId);
            if (assignedBot?.state === 'WORKING') {
              return { ...zone, status: 'IN_PROGRESS' };
            }
          } else if (zone.status === 'IN_PROGRESS') {
            const newRemaining = Math.max(0, zone.timeRemainingSeconds - 1);
            const assignedBot = robots.find(r => r.id === zone.assignedRobotId);

            if (assignedBot?.workProgress && assignedBot.workProgress >= 100) {
              return { ...zone, status: 'COMPLETED', timeRemainingSeconds: 0 };
            }
            if (newRemaining === 0) {
              addMessage('Dispatch', 'Fleet', `⚠️ DEADLINE EXPIRED: ${zone.name} is now OVERDUE!`, 'ALERT');
              return { ...zone, status: 'OVERDUE', timeRemainingSeconds: 0 };
            }
            return { ...zone, timeRemainingSeconds: newRemaining };
          }
          return zone;
        });
      });

      // 3. Multi-Robot Dependency Detection (Section 7)
      // Reference Case: Water Waste Collector produces water -> Tree Planter needs water
      const waterCollector = robots.find(r => r.role === 'WATER_COLLECTOR' && r.state === 'WORKING' && r.workProgress >= 40);
      const treePlanter = robots.find(r => r.role === 'PLANTER' && (r.state === 'WORKING' || r.state === 'TRAVELLING'));

      if (waterCollector && treePlanter && !coordinationAlert && !transferState) {
        setCoordinationAlert({
          id: 'coord-' + Date.now(),
          sourceRobotId: waterCollector.id,
          sourceZoneId: waterCollector.assignedZoneId || 'Z001',
          targetRobotId: treePlanter.id,
          targetZoneId: treePlanter.assignedZoneId || 'Z002',
          resourceType: 'Purified Water',
          amount: 500,
          message: `${waterCollector.name} in Zone 1 has collected 500L water waste. ${treePlanter.name} in Zone 2 requires water for planting. Assign a robot to transport the water?`,
          status: 'PENDING',
        });

        addMessage(
          waterCollector.name,
          'TerraPlanter-2',
          '500L water waste purified and ready for pickup at Zone 1.',
          'ALERT'
        );
      }

      // 4. Progress Active Coordination Transfer (Section 7)
      if (transferState) {
        const transporter = robots.find(r => r.id === transferState.transportRobotId);
        const sourceZone = zones.find(z => z.id === transferState.sourceZoneId);
        const targetZone = zones.find(z => z.id === transferState.targetZoneId);

        if (transporter && sourceZone && targetZone) {
          if (transferState.phase === 'PICKUP') {
            // Check if transporter reached pickup zone
            const sx = sourceZone.x + sourceZone.width / 2;
            const sy = sourceZone.y + sourceZone.height / 2;
            if (Math.hypot(transporter.x - sx, transporter.y - sy) < 30) {
              // Loaded! Now travel to target zone
              setRobots(prev =>
                prev.map(r =>
                  r.id === transporter.id
                    ? {
                        ...r,
                        currentLoad: 500,
                        state: 'TRAVELLING',
                        targetX: targetZone.x + targetZone.width / 2,
                        targetY: targetZone.y + targetZone.height / 2,
                      }
                    : r
                )
              );
              setTransferState(prev => (prev ? { ...prev, phase: 'DELIVERY', progress: 0.5 } : null));
              addMessage(transporter.name, 'TerraPlanter-2', '500L Water picked up from Zone 1. Inbound to Zone 2, ETA 8s.', 'LOGISTICS');
            }
          } else if (transferState.phase === 'DELIVERY') {
            // Check if reached destination zone
            const tx = targetZone.x + targetZone.width / 2;
            const ty = targetZone.y + targetZone.height / 2;
            if (Math.hypot(transporter.x - tx, transporter.y - ty) < 30) {
              // Unloaded! Complete transfer
              setRobots(prev =>
                prev.map(r =>
                  r.id === transporter.id
                    ? { ...r, currentLoad: 0, state: 'IDLE' }
                    : r
                )
              );
              setTransferState(null);
              addMessage(treePlanter?.name ?? 'TerraPlanter-2', transporter.name, '500L water received. Storage filled, planting cycle progressing!', 'CONFIRM');
            }
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [robots, zones, coordinationAlert, transferState, lowBatteryAlert]);

  // Create new robot
  const handleCreateRobot = (newBot: PlatformRobot) => {
    setRobots(prev => [...prev, newBot]);
    addMessage('Dispatch', newBot.name, `Robot commissioned into fleet: Role ${newBot.role}, Capacity ${newBot.capacity}kg.`, 'STATUS');
  };

  // Create new zone
  const handleCreateZone = (newZone: WorkZone) => {
    setZones(prev => [...prev, newZone]);
    addMessage('Dispatch', 'Fleet', `New Work Zone plotted: ${newZone.name} (${newZone.taskType}).`, 'STATUS');
  };

  const idleRobots = robots.filter(r => r.state === 'IDLE');

  return (
    <div style={{ padding: '0 24px 60px', maxWidth: 1700, margin: '0 auto' }}>
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onLogin={handleLogin} />

      {/* Onboarding Mascot Modal */}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* Create Robot Modal */}
      <CreateRobotModal
        isOpen={isCreateRobotOpen}
        onClose={() => setIsCreateRobotOpen(false)}
        onCreateRobot={handleCreateRobot}
        nextIdNumber={robots.length + 1}
      />

      {/* Zone Form Modal */}
      <ZoneFormModal
        isOpen={zoneDraft !== null}
        zoneDraft={zoneDraft}
        onClose={() => setZoneDraft(null)}
        onCreateZone={handleCreateZone}
        nextZoneNumber={zones.length + 1}
      />

      {/* Coordination Alert Prompt Modal */}
      <CoordinationPromptModal
        alert={coordinationAlert}
        idleRobots={idleRobots}
        zones={zones}
        onAssignTransport={handleAssignTransport}
        onOpenCreateRobot={() => setIsCreateRobotOpen(true)}
        onDismiss={() => setCoordinationAlert(null)}
      />

      {/* Low Battery Alert Prompt Modal */}
      <LowBatteryPromptModal
        robot={lowBatteryAlert?.robot || null}
        zone={lowBatteryAlert?.zone || null}
        idleRobots={idleRobots}
        onRecallToCharger={handleRecallToCharger}
        onDispatchReplacement={handleDispatchReplacement}
        onDismiss={() => setLowBatteryAlert(null)}
      />

      {/* Header Bar */}
      <div
        style={{
          padding: '20px 0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
              📍 Multi-Robot Zone Assignment & Coordination Platform
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 100,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              Enterprise Fleet Dashboard
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Draw work zones · Drag & drop robot vacuum-style dispatch · Automated producer-consumer dependency coordination
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Help mascot button */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '8px 14px', fontSize: 12 }}
          >
            🤖 RoboGuide Instructions
          </button>

          {/* Toggle between Map View and Topology Network View */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
            <button
              onClick={() => setActiveTab('MAP')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'MAP' ? '#6366f1' : 'transparent',
                color: activeTab === 'MAP' ? '#fff' : '#94a3b8',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🗺️ Zone Canvas
            </button>
            <button
              onClick={() => setActiveTab('TOPOLOGY')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'TOPOLOGY' ? '#6366f1' : 'transparent',
                color: activeTab === 'TOPOLOGY' ? '#fff' : '#94a3b8',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌐 Cisco Topology & Chat
            </button>
          </div>

          {/* Link to 500+ Mesh Engine */}
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button
              className="btn btn-ghost"
              style={{ width: 'auto', padding: '8px 16px', fontSize: 12, border: '1px solid #06b6d4', color: '#67e8f9' }}
            >
              ⚡ 500+ AMR Mesh Engine →
            </button>
          </Link>
        </div>
      </div>

      {/* Fleet Overview KPIs */}
      <FleetOverviewBar robots={robots} zones={zones} operatorName={operatorName || 'Commander'} />

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginTop: 18 }}>
        {/* Left: Map Canvas OR Topology View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeTab === 'MAP' ? (
            <div className="glass" style={{ padding: 18 }}>
              <ZoneCanvas
                robots={robots}
                zones={zones}
                onZoneCreated={setZoneDraft}
                onUpdateZone={handleUpdateZone}
                onDeleteZone={handleDeleteZone}
                onDeselectAll={() => {
                  setSelectedZoneId(null);
                  setSelectedRobotId(null);
                }}
                onAssignRobotToZone={handleAssignRobotToZone}
                onSelectRobot={r => setSelectedRobotId(r.id)}
                onSelectZone={z => setSelectedZoneId(z.id)}
                selectedRobotId={selectedRobotId}
                selectedZoneId={selectedZoneId}
                activeCoordinationTransfer={transferState}
              />
            </div>
          ) : (
            <TopologyNetworkView robots={robots} zones={zones} messages={messages} />
          )}

          {/* Secondary View: Live Inter-Robot Comms below Canvas when on Map Tab */}
          {activeTab === 'MAP' && (
            <TopologyNetworkView robots={robots} zones={zones} messages={messages} />
          )}
        </div>

        {/* Right: Fleet Sidebar */}
        <div className="glass" style={{ padding: 18, height: 'fit-content' }}>
          <FleetSidebar
            robots={robots}
            onOpenCreateModal={() => setIsCreateRobotOpen(true)}
            onRecallToCharger={handleRecallToCharger}
            onSelectRobot={r => setSelectedRobotId(r.id)}
            selectedRobotId={selectedRobotId}
          />
        </div>
      </div>
    </div>
  );
}
