'use client';
import { useEffect, useState } from 'react';
import type {
  PlatformRobot,
  WorkZone,
  CoordinationAlert,
  InterRobotMessage,
} from '@/types/platform';
import CreateRobotModal from '@/components/platform/CreateRobotModal';
import ZoneFormModal from '@/components/platform/ZoneFormModal';
import CoordinationPromptModal from '@/components/platform/CoordinationPromptModal';
import LowBatteryPromptModal from '@/components/platform/LowBatteryPromptModal';
import ZoneCanvas from '@/components/platform/ZoneCanvas';
import FleetSidebar from '@/components/platform/FleetSidebar';
import TopologyNetworkView from '@/components/platform/TopologyNetworkView';
import FleetOverviewBar from '@/components/platform/FleetOverviewBar';
import RoveraConflictsView from '@/components/platform/RoveraConflictsView';
import RoveraEnergyView from '@/components/platform/RoveraEnergyView';
import RoveraResilienceView from '@/components/platform/RoveraResilienceView';
import RoveraSwarmBenchmarkView from '@/components/platform/RoveraSwarmBenchmarkView';
import AICommunicationPanel from '@/components/platform/AICommunicationPanel';
import { generateAutonomousAIDialogue } from '@/lib/aiFleetAgent';
import {
  checkSupabaseHealth,
  fetchRobots as fetchCloudRobots,
  fetchZones as fetchCloudZones,
  upsertRobot as upsertCloudRobot,
  deleteRobot as deleteCloudRobot,
  upsertZone as upsertCloudZone,
  deleteZone as deleteCloudZone,
  logMessage as logCloudMessage,
  bulkSyncFleet,
  subscribeToFleet,
} from '@/lib/supabaseBackend';

// Initial pre-configured seed robots (All idle standby at Fleet Staging Base on load)
const INITIAL_ROBOTS: PlatformRobot[] = [
  {
    id: 'R0001',
    name: 'Scout Drone R1',
    labelCode: 'R1',
    role: 'GENERAL',
    battery: 94,
    health: 98,
    speed: 4.8,
    capacity: 60,
    currentLoad: 0,
    state: 'IDLE',
    x: 120,
    y: 65,
    radioRadius: 85,
    assignedZoneId: null,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0002',
    name: 'Hydro Harvester R2',
    labelCode: 'R2',
    role: 'WATER_COLLECTOR',
    battery: 88,
    health: 95,
    speed: 3.5,
    capacity: 120,
    currentLoad: 0,
    state: 'IDLE',
    x: 180,
    y: 65,
    radioRadius: 90,
    assignedZoneId: null,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0003',
    name: 'Agri Cultivator R3',
    labelCode: 'R3',
    role: 'PLANTER',
    battery: 86,
    health: 92,
    speed: 3.2,
    capacity: 90,
    currentLoad: 0,
    state: 'IDLE',
    x: 240,
    y: 65,
    radioRadius: 85,
    assignedZoneId: null,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0004',
    name: 'Mesh Relay Node R4',
    labelCode: 'R4',
    role: 'CLEANER',
    battery: 96,
    health: 99,
    speed: 4.2,
    capacity: 50,
    currentLoad: 0,
    state: 'IDLE',
    x: 300,
    y: 65,
    radioRadius: 110,
    assignedZoneId: null,
    workProgress: 0,
    workTimeRemaining: 0,
  },
  {
    id: 'R0005',
    name: 'Heavy Transporter R5',
    labelCode: 'R5',
    role: 'TRANSPORTER',
    battery: 92,
    health: 100,
    speed: 5.2,
    capacity: 160,
    currentLoad: 0,
    state: 'IDLE',
    x: 360,
    y: 65,
    radioRadius: 80,
    assignedZoneId: null,
    workProgress: 0,
    workTimeRemaining: 0,
  },
];

// Initial pre-configured seed zones with multi-resources (Purified Water, Mineral Ore, Power Cells, Bio-Nutrient)
const INITIAL_ZONES: WorkZone[] = [
  {
    id: 'Z001',
    name: 'Zone A · Water Synthesis',
    x: 90,
    y: 150,
    width: 280,
    height: 210,
    color: '#06b6d4',
    taskType: 'WATER_WASTE',
    taskCode: '💧 T1',
    difficulty: 'MEDIUM',
    timeLimitSeconds: 90,
    timeRemainingSeconds: 90,
    resourceProduced: { type: 'Purified Water', amount: 500 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
  {
    id: 'Z002',
    name: 'Zone B · Mineral Ore Mining',
    x: 420,
    y: 190,
    width: 280,
    height: 210,
    color: '#a855f7',
    taskType: 'INSPECTION',
    taskCode: '⛏️ T2',
    difficulty: 'HARD',
    hazardText: '!Hazard',
    timeLimitSeconds: 100,
    timeRemainingSeconds: 100,
    resourceProduced: { type: 'Mineral Ore / Silicon', amount: 350 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
  {
    id: 'Z003',
    name: 'Zone C · Agri Bio-Nutrient',
    x: 740,
    y: 440,
    width: 280,
    height: 210,
    color: '#10b981',
    taskType: 'TREE_PLANTING',
    taskCode: '🌱 T3',
    difficulty: 'HARD',
    timeLimitSeconds: 120,
    timeRemainingSeconds: 120,
    resourceRequired: { type: 'Purified Water', amount: 500 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
  {
    id: 'Z004',
    name: 'Zone D · Power Cell Storage',
    x: 480,
    y: 720,
    width: 290,
    height: 200,
    color: '#f59e0b',
    taskType: 'CLEANING',
    taskCode: '⚡ T4',
    difficulty: 'MEDIUM',
    timeLimitSeconds: 85,
    timeRemainingSeconds: 85,
    resourceProduced: { type: 'Charged Power Cells', amount: 150 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
  {
    id: 'Z005',
    name: 'Zone E · Component Logistics',
    x: 120,
    y: 690,
    width: 290,
    height: 210,
    color: '#ef4444',
    taskType: 'DELIVERY',
    taskCode: '📦 T5',
    difficulty: 'MEDIUM',
    hazardText: '!Debris',
    timeLimitSeconds: 95,
    timeRemainingSeconds: 95,
    resourceRequired: { type: 'Mineral Ore / Silicon', amount: 200 },
    currentResourceLevel: 0,
    status: 'UNASSIGNED',
    assignedRobotId: null,
  },
];

export default function PlatformPage() {
  const [operatorName] = useState<string>('Commander');
  const [isCreateRobotOpen, setIsCreateRobotOpen] = useState(false);
  const [zoneDraft, setZoneDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [robots, setRobots] = useState<PlatformRobot[]>(INITIAL_ROBOTS);
  const [zones, setZones] = useState<WorkZone[]>(INITIAL_ZONES);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  type RoveraTab = 'MISSION_CONTROL' | 'NETWORK_AI_COMMS' | 'CONFLICTS' | 'BATTERY_RTB' | 'RESILIENCE' | 'BENCHMARKS';
  const [activeTab, setActiveTab] = useState<RoveraTab>('MISSION_CONTROL');
  const [isAiAutoChatActive, setIsAiAutoChatActive] = useState(true);
  const [controllerOnline, setControllerOnline] = useState(true);
  const [layerMesh, setLayerMesh] = useState(true);
  const [layerConflicts, setLayerConflicts] = useState(true);
  const [layerChargers, setLayerChargers] = useState(true);
  const [layerDeadlocks, setLayerDeadlocks] = useState(true);

  // Live Deadlock Scenario State for Mission Control simulation
  const [deadlockScenario, setDeadlockScenario] = useState<{
    robotAId: string;
    robotBId: string;
    zoneName: string;
    step: 'DETECTED' | 'RESOLVING' | 'RESOLVED';
    wfgCycle?: string;
  } | null>(null);

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


  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tablesReady: boolean;
    message: string;
    isSyncing: boolean;
  }>({
    connected: false,
    tablesReady: false,
    message: 'Connecting to Supabase Cloud...',
    isSyncing: false,
  });

  // Supabase Initial Connect & Cloud State Sync
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initSupabase() {
      try {
        const health = await checkSupabaseHealth();
        setSupabaseStatus(prev => ({
          ...prev,
          connected: health.connected,
          tablesReady: health.tablesReady,
          message: health.message,
        }));

        if (health.connected && health.tablesReady) {
          const [{ data: cloudRobots }, { data: cloudZones }] = await Promise.all([
            fetchCloudRobots(),
            fetchCloudZones(),
          ]);

          if (cloudRobots && cloudRobots.length > 0) {
            setRobots(cloudRobots);
          } else {
            await bulkSyncFleet(INITIAL_ROBOTS, INITIAL_ZONES);
          }

          if (cloudZones && cloudZones.length > 0) {
            setZones(cloudZones);
          }

          // Realtime multi-client subscription
          unsubscribe = subscribeToFleet(
            ({ eventType, new: newRobot, old: oldId }) => {
              if (eventType === 'INSERT' && newRobot) {
                setRobots(prev => (prev.some(r => r.id === newRobot.id) ? prev : [...prev, newRobot]));
              } else if (eventType === 'UPDATE' && newRobot) {
                setRobots(prev => prev.map(r => (r.id === newRobot.id ? newRobot : r)));
              } else if (eventType === 'DELETE' && oldId) {
                setRobots(prev => prev.filter(r => r.id !== oldId.id));
              }
            },
            ({ eventType, new: newZone, old: oldId }) => {
              if (eventType === 'INSERT' && newZone) {
                setZones(prev => (prev.some(z => z.id === newZone.id) ? prev : [...prev, newZone]));
              } else if (eventType === 'UPDATE' && newZone) {
                setZones(prev => prev.map(z => (z.id === newZone.id ? newZone : z)));
              } else if (eventType === 'DELETE' && oldId) {
                setZones(prev => prev.filter(z => z.id !== oldId.id));
              }
            }
          );
        }
      } catch (err) {
        console.warn('Supabase initialization fallback:', err);
      }
    }

    initSupabase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Manual Push to Supabase Cloud
  const handleManualSync = async () => {
    setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await bulkSyncFleet(robots, zones);
      if (res.success) {
        addMessage('Supabase Cloud', 'Fleet', '⚡ Complete fleet telemetry and work zone state synchronized to cloud database.', 'CONFIRM');
        setSupabaseStatus(prev => ({
          ...prev,
          connected: true,
          tablesReady: true,
          isSyncing: false,
          message: 'Cloud Synced',
        }));
      } else {
        addMessage('Supabase Cloud', 'Fleet', `⚠️ Cloud sync notice: ${res.error}. Run supabase_schema.sql in Supabase SQL editor.`, 'ALERT');
        setSupabaseStatus(prev => ({ ...prev, isSyncing: false, message: res.error || 'Sync failed' }));
      }
    } catch {
      setSupabaseStatus(prev => ({ ...prev, isSyncing: false, message: 'Sync error' }));
    }
  };

  // Add Log Message Helper (Local + Cloud Telemetry)
  const addMessage = (from: string, to: string, content: string, badge: 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT' = 'LOGISTICS') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newMsg: InterRobotMessage = {
      id: 'm-' + Date.now() + Math.floor(Math.random() * 1000),
      timestamp: timeStr,
      fromRobot: from,
      toRobot: to,
      content,
      badge,
    };
    setMessages(prev => [...prev, newMsg]);
    logCloudMessage(newMsg).catch(() => {});
  };

  // Deadlock Simulation Handler (Corridor Contention, Tarjan Cycle Detection, AI Lateral Detour Prevention)
  const triggerDeadlockSimulation = (botAId = 'R0001', botBId = 'R0002') => {
    setActiveTab('MISSION_CONTROL');

    // Phase 1: Contending robots converge head-on into narrow corridor between Zone A & Zone B
    setRobots(prev =>
      prev.map(r => {
        if (r.id === botAId) {
          return { ...r, state: 'TRAVELLING', x: 330, y: 230, targetX: 430, targetY: 230, speed: 2.5 };
        }
        if (r.id === botBId) {
          return { ...r, state: 'TRAVELLING', x: 590, y: 230, targetX: 490, targetY: 230, speed: 2.5 };
        }
        return r;
      })
    );

    addMessage('Traffic Monitor', 'Fleet', '⚠️ CORRIDOR CONTENTION: Scout Drone R1 and Hydro Harvester R2 entering single-lane transit corridor simultaneously.', 'ALERT');

    // Phase 2: Deadlock Detected (Circular Wait-For-Graph Cycle)
    setTimeout(() => {
      setRobots(prev =>
        prev.map(r => {
          if (r.id === botAId) {
            return { ...r, state: 'IDLE', x: 430, y: 230, targetX: null, targetY: null };
          }
          if (r.id === botBId) {
            return { ...r, state: 'IDLE', x: 490, y: 230, targetX: null, targetY: null };
          }
          return r;
        })
      );

      setDeadlockScenario({
        robotAId: botAId,
        robotBId: botBId,
        zoneName: 'Inter-Zone Corridor (Alpha ↔ Beta)',
        step: 'DETECTED',
        wfgCycle: 'Tarjan WFG Cycle: R1 (holds West-Access, waits for East) ⇄ R2 (holds East-Access, waits for West)',
      });

      addMessage('Tarjan WFG Engine', 'Fleet', '🚨 DEADLOCK DETECTED: Circular dependency cycle identified between R1 and R2. Corridor traffic frozen.', 'ALERT');
    }, 1800);

    // Phase 3: Resolving via AI Priority Arbitration & 90° Lateral Detour
    setTimeout(() => {
      setDeadlockScenario({
        robotAId: botAId,
        robotBId: botBId,
        zoneName: 'Inter-Zone Corridor (Alpha ↔ Beta)',
        step: 'RESOLVING',
        wfgCycle: 'AI Priority Arbitration: R1 (Priority 1: Critical Recon) wins Right-of-Way. R2 (Priority 2) yields via 90° lateral detour into clearance pocket (490, 310).',
      });

      // Move R2 out of the corridor into the clearance pocket, and R1 proceeds forward
      setRobots(prev =>
        prev.map(r => {
          if (r.id === botBId) {
            return { ...r, state: 'TRAVELLING', targetX: 490, targetY: 310, speed: 3.2 };
          }
          if (r.id === botAId) {
            return { ...r, state: 'TRAVELLING', targetX: 580, targetY: 230, speed: 3.6 };
          }
          return r;
        })
      );

      addMessage('AI Deadlock Recovery', 'Fleet', '🛡️ AI RESOLUTION: Priority awarded to R1. R2 executing lateral clearance maneuver to pocket (x: 490, y: 310).', 'CONFIRM');
    }, 4500);

    // Phase 4: Resolved
    setTimeout(() => {
      setDeadlockScenario({
        robotAId: botAId,
        robotBId: botBId,
        zoneName: 'Inter-Zone Corridor (Alpha ↔ Beta)',
        step: 'RESOLVED',
        wfgCycle: 'Deadlock Cleared: Wait-For Graph cycle dissolved. Zero packet loss, 100% spatial safety verified.',
      });

      // R2 resumes its trajectory back towards Zone A
      setRobots(prev =>
        prev.map(r => {
          if (r.id === botBId) {
            return { ...r, state: 'TRAVELLING', targetX: 230, targetY: 250, speed: 3.2 };
          }
          return r;
        })
      );

      addMessage('System Core', 'Fleet', '✅ DEADLOCK RESOLVED: Corridor clear. Both agents successfully navigated without collision.', 'CONFIRM');
    }, 7800);

    // Phase 5: Clean up deadlock overlay
    setTimeout(() => {
      setDeadlockScenario(null);
    }, 11000);
  };

  // Run Demo (Automated Process with Recommendations & Deadlock Simulation)
  const handleRunDemo = () => {
    setActiveTab('MISSION_CONTROL');
    addMessage('Command', 'Fleet', '⚡ RUN DEMO INITIATED: Automated process dispatched with interactive recommendations.', 'STATUS');

    // 1. Dispatch R1 to Zone A (Water Synthesis T1)
    setTimeout(() => {
      handleAssignRobotToZone('R0001', 'Z001');
    }, 600);

    // 2. Dispatch R2 to Zone B (Mineral Ore Mining T2)
    setTimeout(() => {
      handleAssignRobotToZone('R0002', 'Z002');
    }, 1600);

    // 3. Dispatch R3 to Zone C (Agri Bio-Nutrient T3)
    setTimeout(() => {
      handleAssignRobotToZone('R0003', 'Z003');
    }, 2600);

    // 4. Recommendation Modal: Multi-Robot Coordination Prompt
    setTimeout(() => {
      setCoordinationAlert({
        id: 'coord-demo-1',
        sourceRobotId: 'R0001',
        sourceZoneId: 'Z001',
        targetRobotId: 'R0003',
        targetZoneId: 'Z003',
        resourceType: 'Purified Water',
        amount: 500,
        message: 'Scout Drone R1 in Zone A has produced 500L Purified Water. Agri Cultivator R3 in Zone C requires water input for Bio-Nutrient cultivation. Recommend deploying Heavy Transporter R5 to bridge the resource pipeline?',
        status: 'PENDING',
      });
      addMessage('AI Recommendation', 'Operator', '💡 RECOMMENDATION: Inter-zone dependency detected. Authorize Heavy Transporter R5 for water payload transfer?', 'LOGISTICS');
    }, 4500);

    // 5. Corridor Deadlock Simulation on Mission Control Canvas
    setTimeout(() => {
      triggerDeadlockSimulation('R0001', 'R0002');
    }, 12000);

    // 6. Battery Critical Intervention Recommendation
    setTimeout(() => {
      const botR3 = robots.find(r => r.id === 'R0003');
      const zoneC = zones.find(z => z.id === 'Z003');
      if (zoneC) {
        setRobots(prev => prev.map(r => (r.id === 'R0003' ? { ...r, battery: 14, state: 'IDLE' } : r)));
        setLowBatteryAlert({
          robot: { ...(botR3 || INITIAL_ROBOTS[2]), battery: 14, state: 'IDLE' },
          zone: zoneC,
        });
        addMessage('Telemetry', 'Agri Cultivator R3', '🔋 BATTERY INTERVENTION: R3 at 14% critical threshold. Recommend recalling to Charge Pad Alpha.', 'ALERT');
      }
    }, 24000);
  };

  // Inject Failure Suite
  const handleInjectFailure = (type: 'MOTOR' | 'BATTERY' | 'COMMS', robotId?: string) => {
    const target = robotId ? robots.find(r => r.id === robotId) : robots[0];
    if (!target) return;
    if (type === 'MOTOR') {
      setRobots(prev => prev.map(r => r.id === target.id ? { ...r, state: 'FAILED', speed: 0 } : r));
      addMessage('Telemetry', target.name, `💥 MOTOR ACTUATOR SEIZURE: Hardware fault on ${target.name}. Work migrating to peer.`, 'ALERT');
    } else if (type === 'BATTERY') {
      setRobots(prev => prev.map(r => r.id === target.id ? { ...r, battery: 12 } : r));
      addMessage('Telemetry', target.name, `🔋 BATTERY CRITICAL: Voltage dropped to 12%. Emergency RTB initiated.`, 'ALERT');
    } else if (type === 'COMMS') {
      addMessage('Telemetry', target.name, `📡 RF COMMS JAMMING: 45% packet loss active. Falling back to gossip mesh.`, 'ALERT');
    }
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

  // Recall to Charging Station (Charging Pad Alpha at top-right)
  const handleRecallToCharger = (robotId: string) => {
    setRobots(prev =>
      prev.map(r => {
        if (r.id === robotId) {
          addMessage(r.name, 'Charging Station', 'Initiated return to Central Charge Pad Alpha.', 'STATUS');
          return {
            ...r,
            state: 'TRAVELLING',
            targetX: 995,
            targetY: 75,
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
    setZones(prev => {
      const updatedList = prev.map(z => (z.id === zoneId ? { ...z, ...updates } : z));
      const target = updatedList.find(z => z.id === zoneId);
      if (target) {
        upsertCloudZone(target).catch(() => {});
      }
      return updatedList;
    });
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
    deleteCloudZone(zoneId).catch(() => {});
  };

  // Simulation Loop (Continuous Physical Travel, Work Countdown, Dependency Detection)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Robots Physics & Travel
      setRobots(prevRobots => {
        return prevRobots.map(robot => {
          const updated = { ...robot };

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

              // Check if arrived at Central Charge Pad Alpha (top-right 995, 75)
              if (Math.hypot(updated.x - 995, updated.y - 75) <= 65 || (updated.x >= 880 && updated.y <= 150)) {
                updated.state = 'CHARGING';
                addMessage(updated.name, 'Dispatch', 'Docked at Central Charge Pad Alpha. Rapid battery cells recharging.', 'STATUS');
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

  // 5. Autonomous AI Inter-Robot Cognitive Communication Loop
  useEffect(() => {
    if (!isAiAutoChatActive) return;
    const aiInterval = setInterval(() => {
      const aiResult = generateAutonomousAIDialogue(robots, zones);
      if (aiResult) {
        const badgeMap: Record<string, 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT'> = {
          DIRECTIVE: 'STATUS',
          NEGOTIATION: 'LOGISTICS',
          LOGISTICS: 'LOGISTICS',
          COLLISION_AVOIDANCE: 'ALERT',
          ENERGY_HANDOVER: 'ALERT',
          STATUS: 'CONFIRM',
        };
        addMessage(aiResult.from, aiResult.to, aiResult.message, badgeMap[aiResult.type] || 'LOGISTICS');
      }
    }, 5500);

    return () => clearInterval(aiInterval);
  }, [isAiAutoChatActive, robots, zones]);

  // Create new robot
  const handleCreateRobot = (newBot: PlatformRobot) => {
    setRobots(prev => [...prev, newBot]);
    addMessage('Dispatch', newBot.name, `Robot commissioned into fleet: Role ${newBot.role}, Capacity ${newBot.capacity}kg.`, 'STATUS');
    upsertCloudRobot(newBot).catch(() => {});
  };

  // Delete robot from fleet
  const handleDeleteRobot = (robotId: string) => {
    const bot = robots.find(r => r.id === robotId);
    setRobots(prev => prev.filter(r => r.id !== robotId));
    setZones(prev =>
      prev.map(z => (z.assignedRobotId === robotId ? { ...z, assignedRobotId: null, status: 'UNASSIGNED' } : z))
    );
    if (selectedRobotId === robotId) setSelectedRobotId(null);
    if (bot) addMessage('Dispatch', 'Fleet', `Robot ${bot.name} decommissioned from fleet.`, 'STATUS');
    deleteCloudRobot(robotId).catch(() => {});
  };

  // Create new zone
  const handleCreateZone = (newZone: WorkZone) => {
    setZones(prev => [...prev, newZone]);
    addMessage('Dispatch', 'Fleet', `New Work Zone plotted: ${newZone.name} (${newZone.taskType}).`, 'STATUS');
    upsertCloudZone(newZone).catch(() => {});
  };

  const idleRobots = robots.filter(r => r.state === 'IDLE');

  return (
    <div style={{ padding: '0 24px 60px', maxWidth: 1700, margin: '0 auto' }}>

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

      {/* 0. TOP COMMAND BAR — Full-width sticky above navbar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          margin: '0 -24px',
          padding: '10px 24px',
          background: 'rgba(8, 12, 20, 0.88)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Brand + Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
              CORE · Tactical Fleet Coordination
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 9999,
                background: controllerOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                color: controllerOnline ? '#4ade80' : '#f87171',
                border: `1px solid ${controllerOnline ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`,
              }}
            >
              {controllerOnline ? 'Central Controller ONLINE' : '100% P2P Mesh Mode'}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 9999,
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              Enterprise HaLow Mesh Core
            </span>
          </div>
          <p style={{ fontSize: 10.5, color: '#64748b', margin: '2px 0 0', lineHeight: 1.3 }}>
            Coordination &amp; Optimization for Robotic Execution · Decentralized P2P Task Negotiation · Collision Detours &amp; Deadlock Recovery
          </p>
        </div>

        {/* Right: Overlays + Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Overlay pills */}
          <div
            style={{
              display: 'flex',
              gap: 5,
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: 9999,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 4px' }}>OVERLAYS</span>
            {([
              { key: 'mesh', label: 'Mesh', active: layerMesh, set: setLayerMesh, color: '#38bdf8' },
              { key: 'conflicts', label: 'Conflicts', active: layerConflicts, set: setLayerConflicts, color: '#f87171' },
              { key: 'bays', label: 'Bays', active: layerChargers, set: setLayerChargers, color: '#fbbf24' },
              { key: 'deadlocks', label: 'Deadlocks', active: layerDeadlocks, set: setLayerDeadlocks, color: '#c084fc' },
            ] as const).map(o => (
              <button
                key={o.key}
                onClick={() => o.set((p: boolean) => !p)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: o.active ? `rgba(${o.color === '#38bdf8' ? '56,189,248' : o.color === '#f87171' ? '239,68,68' : o.color === '#fbbf24' ? '245,158,11' : '168,85,247'}, 0.18)` : 'transparent',
                  border: o.active ? `1px solid ${o.color}55` : '1px solid transparent',
                  color: o.active ? o.color : '#64748b',
                  boxShadow: o.active ? `inset 0 1px 1px rgba(255,255,255,0.35)` : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <span style={{ fontSize: 7 }}>{o.active ? '●' : '○'}</span>
                {o.label}
              </button>
            ))}
          </div>

          {/* Supabase Cloud Live Sync Pill & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              title={supabaseStatus.message}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 9999,
                background: supabaseStatus.connected
                  ? (supabaseStatus.tablesReady ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)')
                  : 'rgba(100, 116, 139, 0.15)',
                border: `1px solid ${
                  supabaseStatus.connected
                    ? (supabaseStatus.tablesReady ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)')
                    : 'rgba(100, 116, 139, 0.3)'
                }`,
                fontSize: 11,
                fontWeight: 700,
                color: supabaseStatus.connected
                  ? (supabaseStatus.tablesReady ? '#4ade80' : '#facc15')
                  : '#94a3b8',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: supabaseStatus.connected
                    ? (supabaseStatus.tablesReady ? '#22c55e' : '#eab308')
                    : '#64748b',
                  boxShadow: supabaseStatus.connected && supabaseStatus.tablesReady ? '0 0 6px #22c55e' : 'none',
                }}
              />
              <span>{supabaseStatus.tablesReady ? 'Supabase Synced' : (supabaseStatus.connected ? 'Supabase Online' : 'Supabase Offline')}</span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={supabaseStatus.isSyncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                cursor: supabaseStatus.isSyncing ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.2) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                color: '#38bdf8',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span>☁️</span>
              <span>{supabaseStatus.isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
          </div>

          {/* Run Demo */}
          <button
            onClick={handleRunDemo}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 16px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(56,189,248,0.95) 0%, rgba(37,99,235,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.65), 0 4px 16px rgba(56,189,248,0.4)',
              color: '#fff',
              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            ⚡ Run Demo
          </button>

          {/* Inject Deadlock */}
          <button
            onClick={() => triggerDeadlockSimulation('R0001', 'R0002')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(239,68,68,0.92) 0%, rgba(185,28,28,0.92) 100%)',
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.55), 0 4px 16px rgba(239,68,68,0.35)',
              color: '#fff',
              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            ⚠️ Inject Deadlock
          </button>
        </div>
      </div>

      {/* 1. Main Headings on Top - Apple-Inspired Glossy Glass Segmented Navigation */}
      <div
        style={{
          marginTop: 10,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'sticky',
          top: 62,
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px',
            borderRadius: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)',
            flexWrap: 'wrap',
            gap: 4,
            maxWidth: '100%',
          }}
        >
          {[
            { id: 'MISSION_CONTROL', label: 'Mission Control & Zones' },
            { id: 'NETWORK_AI_COMMS', label: 'Cisco Topology & AI Communication' },
            { id: 'CONFLICTS', label: 'Conflicts & Deadlocks' },
            { id: 'BATTERY_RTB', label: 'Battery & Energy RTB' },
            { id: 'RESILIENCE', label: 'Faults & Mesh Resilience' },
            { id: 'BENCHMARKS', label: '500+ Swarm Benchmarks' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as RoveraTab)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.28)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.95), rgba(37, 99, 235, 0.95))'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: 12.5,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? '0 4px 18px rgba(56, 189, 248, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.5)'
                    : 'none',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#f1f5f9';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onMouseDown={e => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>


      {/* Fleet Overview KPIs */}
      <FleetOverviewBar robots={robots} zones={zones} operatorName={operatorName || 'Commander'} />

      {/* Tab Content Display */}
      <div style={{ marginTop: 18 }}>
        {/* Tab 1: Mission Control (Interactive Zone Plotting, Drag & Drop, Vacuum Cleaner Travel, Fleet Sidebar) */}
        {activeTab === 'MISSION_CONTROL' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            {/* Left: Map Canvas, AI Communications & Topology */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="glass" style={{ padding: 18 }}>
                <ZoneCanvas
                  robots={robots}
                  zones={zones}
                  messages={messages}
                  onZoneCreated={setZoneDraft}
                  onUpdateZone={handleUpdateZone}
                  onDeleteZone={handleDeleteZone}
                  onDeselectAll={() => {
                    setSelectedZoneId(null);
                    setSelectedRobotId(null);
                  }}
                  onAssignRobotToZone={handleAssignRobotToZone}
                  onRecallToCharger={handleRecallToCharger}
                  onSelectRobot={r => setSelectedRobotId(r.id)}
                  onSelectZone={z => setSelectedZoneId(z.id)}
                  selectedRobotId={selectedRobotId}
                  selectedZoneId={selectedZoneId}
                  activeCoordinationTransfer={transferState}
                  deadlockScenario={deadlockScenario}
                />
              </div>

              {/* Live AI Inter-Robot Communication & Directive Console */}
              <AICommunicationPanel
                robots={robots}
                zones={zones}
                messages={messages}
                onSendMessage={({ from, to, content, badge }) => addMessage(from, to, content, badge)}
                isAiAutoChatActive={isAiAutoChatActive}
                onToggleAiAutoChat={() => setIsAiAutoChatActive(prev => !prev)}
              />

              {/* Secondary View: Live Cisco Network Topology below Canvas */}
              <TopologyNetworkView robots={robots} zones={zones} messages={messages} />
            </div>


            {/* Right: Fleet Sidebar */}
            <div className="glass" style={{ padding: 18, height: 'fit-content' }}>
              <FleetSidebar
                robots={robots}
                onOpenCreateModal={() => setIsCreateRobotOpen(true)}
                onRecallToCharger={handleRecallToCharger}
                onDeleteRobot={handleDeleteRobot}
                onSelectRobot={r => setSelectedRobotId(r.id)}
                selectedRobotId={selectedRobotId}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Unified Cisco Network Topology & AI Inter-Robot Communication Hub */}
        {activeTab === 'NETWORK_AI_COMMS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TopologyNetworkView robots={robots} zones={zones} messages={messages} />
            <AICommunicationPanel
              robots={robots}
              zones={zones}
              messages={messages}
              onSendMessage={({ from, to, content, badge }) => addMessage(from, to, content, badge)}
              isAiAutoChatActive={isAiAutoChatActive}
              onToggleAiAutoChat={() => setIsAiAutoChatActive(prev => !prev)}
            />
          </div>
        )}

        {/* Tab 3: Conflicts & Deadlocks */}
        {activeTab === 'CONFLICTS' && (
          <RoveraConflictsView robots={robots} zones={zones} />
        )}

        {/* Tab 4: Battery & RTB */}
        {activeTab === 'BATTERY_RTB' && (
          <RoveraEnergyView robots={robots} zones={zones} onRecallToCharger={handleRecallToCharger} />
        )}

        {/* Tab 5: Faults & Mesh Resilience */}
        {activeTab === 'RESILIENCE' && (
          <RoveraResilienceView
            robots={robots}
            zones={zones}
            controllerOnline={controllerOnline}
            onToggleController={() => {
              setControllerOnline(prev => !prev);
              addMessage(
                'System Core',
                'Fleet',
                controllerOnline
                  ? '⚡ CENTRAL CONTROLLER TERMINATED. Ad-hoc P2P gossip mesh protocol activated.'
                  : '🔄 CENTRAL CONTROLLER RESTORED. Telemetry synchronized.',
                'ALERT'
              );
            }}
            onInjectFailure={handleInjectFailure}
          />
        )}

        {/* Tab 6: 500+ Swarm Benchmarks */}
        {activeTab === 'BENCHMARKS' && (
          <RoveraSwarmBenchmarkView />
        )}
      </div>
    </div>
  );
}
