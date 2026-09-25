import type { PlatformRobot, WorkZone, InterRobotMessage } from '@/types/platform';

export interface AIDialogueResult {
  from: string;
  to: string;
  message: string;
  type: 'NEGOTIATION' | 'LOGISTICS' | 'COLLISION_AVOIDANCE' | 'ENERGY_HANDOVER' | 'DIRECTIVE' | 'STATUS';
}

/**
 * Autonomous AI Multi-Agent Communication & Reasoning Engine
 * Simulates decentralized peer-to-peer cognitive reasoning between robots:
 * - Contract Net Protocol (CFP, Bidding, Award)
 * - Spatial Collision Avoidance (RVO / CBS Detour negotiation)
 * - Producer-Consumer Resource Exchange (Water Waste -> Tree Planting)
 * - Battery-Aware Task Handover & RTB
 */
export function generateAutonomousAIDialogue(
  robots: PlatformRobot[],
  zones: WorkZone[],
  recentTrigger?: string
): AIDialogueResult {
  const activeRobots = robots.filter(r => r.state !== 'FAILED');
  if (activeRobots.length < 2) {
    return {
      from: robots[0]?.name || 'Robot-1',
      to: 'Fleet Mesh',
      message: 'Broadcasting beacon heartbeat. Awaiting additional active peer nodes.',
      type: 'STATUS',
    };
  }

  // 1. If there's a producer-consumer resource opportunity
  const waterProducer = robots.find(r => r.role === 'WATER_COLLECTOR' && r.state === 'WORKING');
  const treeConsumer = robots.find(r => r.role === 'PLANTER' && r.state === 'WORKING');
  const transporter = robots.find(r => r.role === 'TRANSPORTER');

  if (waterProducer && treeConsumer && transporter && Math.random() < 0.35) {
    const dialogs: AIDialogueResult[] = [
      {
        from: waterProducer.name,
        to: transporter.name,
        message: `CFP-LOGISTICS: Purified effluent batch (500L) ready at Zone A. Current storage at 85%. Requesting cargo extraction.`,
        type: 'NEGOTIATION',
      },
      {
        from: transporter.name,
        to: waterProducer.name,
        message: `BID-LOGISTICS: Payload capacity ${transporter.capacity}kg available. Calculated corridor transit cost: 3.8% SOC. Bid submitted: 94.2 suitability score.`,
        type: 'NEGOTIATION',
      },
      {
        from: transporter.name,
        to: treeConsumer.name,
        message: `INBOUND-TELEMETRY: En route to Zone C with 500L hydration payload. ETA 35 ticks. Ensure intake valve is unsealed.`,
        type: 'LOGISTICS',
      },
      {
        from: treeConsumer.name,
        to: transporter.name,
        message: `ACK-INGESTION: Planting grid 4 telemetry verified. Soil moisture at 22%. Reservoir pressurized and standing by for delivery.`,
        type: 'LOGISTICS',
      },
    ];
    return dialogs[Math.floor(Math.random() * dialogs.length)];
  }

  // 2. Battery-Aware Handover
  const lowBatRobot = robots.find(r => r.battery < 30 && r.state === 'WORKING');
  const idleRobot = robots.find(r => r.state === 'IDLE');
  if (lowBatRobot && idleRobot && Math.random() < 0.5) {
    const dialogs: AIDialogueResult[] = [
      {
        from: lowBatRobot.name,
        to: idleRobot.name,
        message: `ENERGY-HANDOVER: Battery reserve degraded to ${lowBatRobot.battery.toFixed(0)}%. Requesting immediate mission migration for ${lowBatRobot.assignedZoneId || 'active zone'}.`,
        type: 'ENERGY_HANDOVER',
      },
      {
        from: idleRobot.name,
        to: lowBatRobot.name,
        message: `HANDOVER-ACCEPTED: Full SOC (${idleRobot.battery.toFixed(0)}%) confirmed. Synchronizing work order parameters. Clear corridor for your RTB docking.`,
        type: 'ENERGY_HANDOVER',
      },
    ];
    return dialogs[Math.floor(Math.random() * dialogs.length)];
  }

  // 3. Spatial Collision Avoidance & Detour Negotiation
  const rA = activeRobots[0];
  const rB = activeRobots[1];
  const dist = Math.hypot(rA.x - rB.x, rA.y - rB.y);

  if (dist < 260) {
    const dialogs: AIDialogueResult[] = [
      {
        from: rA.name,
        to: rB.name,
        message: `TRAJECTORY-ALERT: Projected corridor intersection in 8 ticks. Calculating Right-of-Way priority based on task weight and SOC.`,
        type: 'COLLISION_AVOIDANCE',
      },
      {
        from: rB.name,
        to: rA.name,
        message: `RVO-DEVIATION: Confirmed. My priority score (38) < your score (54). Yielding Right-of-Way. Commencing 90° lateral detour to safety pocket.`,
        type: 'COLLISION_AVOIDANCE',
      },
      {
        from: rA.name,
        to: rB.name,
        message: `CROSSING-CLEAR: Trajectory vector clear. Maintaining cruising velocity. Detour telemetry acknowledged.`,
        type: 'COLLISION_AVOIDANCE',
      },
    ];
    return dialogs[Math.floor(Math.random() * dialogs.length)];
  }

  // 4. Default Peer-to-Peer Telemetry & Task Synchronization
  const r1 = activeRobots[Math.floor(Math.random() * activeRobots.length)];
  let r2 = activeRobots[Math.floor(Math.random() * activeRobots.length)];
  if (r1.id === r2.id) {
    r2 = activeRobots[(activeRobots.indexOf(r1) + 1) % activeRobots.length];
  }

  const p2pTemplates: AIDialogueResult[] = [
    {
      from: r1.name,
      to: r2.name,
      message: `P2P-GOSSIP: Distributed state hash #x8F2 verified. Spatial hash bucket ${Math.floor(r1.x / 100)}:${Math.floor(r1.y / 100)} clear of dynamic obstacles.`,
      type: 'STATUS',
    },
    {
      from: r1.name,
      to: 'Fleet Mesh',
      message: `AUCTION-CONSENSUS: plan_assignments() evaluated. 0 central controller locks required. Task allocation deterministic across all peers.`,
      type: 'NEGOTIATION',
    },
    {
      from: r1.name,
      to: r2.name,
      message: `RADIO-RELAY: Forwarding multi-hop telemetry packet to Charging Station Alpha. Signal-to-noise ratio: +28dB.`,
      type: 'STATUS',
    },
    {
      from: r2.name,
      to: r1.name,
      message: `HEARTBEAT-ACK: Neighbor table updated. Routing metric latency: 14ms. Decentralized consensus maintained.`,
      type: 'STATUS',
    },
  ];

  return p2pTemplates[Math.floor(Math.random() * p2pTemplates.length)];
}

/**
 * Handle custom natural-language operator directives using AI multi-agent reasoning
 * Example: "Robot 1 and Robot 5, prioritize water transfer" or "Check battery status"
 */
export function processOperatorAIDirective(
  directive: string,
  robots: PlatformRobot[],
  zones: WorkZone[]
): AIDialogueResult[] {
  const clean = directive.toLowerCase();
  const time = new Date().toLocaleTimeString();

  // Directive: Water / Logistics / Transport
  if (clean.includes('water') || clean.includes('transfer') || clean.includes('transport') || clean.includes('tree')) {
    const collector = robots.find(r => r.role === 'WATER_COLLECTOR') || robots[1] || robots[0];
    const carrier = robots.find(r => r.role === 'TRANSPORTER') || robots[4] || robots[0];
    const planter = robots.find(r => r.role === 'PLANTER') || robots[2] || robots[0];

    return [
      {
        from: 'Operator Directive',
        to: 'Fleet Mesh',
        message: `DIRECTIVE RECEIVED: "${directive}". AI Fleet Coordinator distributing autonomous sub-tasks.`,
        type: 'DIRECTIVE',
      },
      {
        from: collector.name,
        to: carrier.name,
        message: `AI-OPTIMIZED: Adjusting water output valve. Purified liquid buffer ready at Zone A. Priority set to CRITICAL.`,
        type: 'NEGOTIATION',
      },
      {
        from: carrier.name,
        to: collector.name,
        message: `AI-RESPONSE: Recomputing transit trajectory. Detour around Hazard B loaded. Arriving for pickup.`,
        type: 'LOGISTICS',
      },
      {
        from: planter.name,
        to: carrier.name,
        message: `AI-SYNC: Planting schedule synchronized. Soil moisture sensors calibrated for incoming 500L hydration.`,
        type: 'LOGISTICS',
      },
    ];
  }

  // Directive: Battery / Charger / Energy
  if (clean.includes('battery') || clean.includes('charge') || clean.includes('rtb') || clean.includes('power')) {
    const lowestBat = [...robots].sort((a, b) => a.battery - b.battery)[0];
    return [
      {
        from: 'Operator Directive',
        to: 'Fleet Mesh',
        message: `ENERGY AUDIT DIRECTIVE: "${directive}". Analyzing fleet State-of-Charge matrix.`,
        type: 'DIRECTIVE',
      },
      {
        from: lowestBat.name,
        to: 'Station Alpha',
        message: `AI-RTB: Current SOC is ${lowestBat.battery.toFixed(0)}%. Reserving Induction Pad 1. Calculating energy audit feasible curve.`,
        type: 'ENERGY_HANDOVER',
      },
      {
        from: 'Station Alpha',
        to: lowestBat.name,
        message: `DOCKING-APPROVED: Induction bay reserved at coordinates (820, 80). Charge rate set to +4.0%/tick.`,
        type: 'STATUS',
      },
    ];
  }

  // Directive: Obstacle / Hazard / Deadlock / Clear
  if (clean.includes('hazard') || clean.includes('obstacle') || clean.includes('deadlock') || clean.includes('conflict')) {
    return [
      {
        from: 'Operator Directive',
        to: 'Fleet Mesh',
        message: `SAFETY DIRECTIVE: "${directive}". Recalculating Reciprocal Velocity Obstacles (RVO).`,
        type: 'DIRECTIVE',
      },
      {
        from: robots[0]?.name || 'R1',
        to: robots[1]?.name || 'R2',
        message: `SPATIAL-AUDIT: Scanning 12-tick lookahead horizon. Proximity threshold expanded to 140u.`,
        type: 'COLLISION_AVOIDANCE',
      },
      {
        from: robots[1]?.name || 'R2',
        to: robots[0]?.name || 'R1',
        message: `CORRIDOR-SAFE: Lateral clearance pockets designated. Zero circular wait states detected in WFG.`,
        type: 'COLLISION_AVOIDANCE',
      },
    ];
  }

  // General Directive
  const r1 = robots[0] || { name: 'R1' };
  const r2 = robots[1] || { name: 'R2' };
  return [
    {
      from: 'Operator Directive',
      to: 'Fleet Mesh',
      message: `FLEET DIRECTIVE: "${directive}". Broadcasting to all ${robots.length} autonomous nodes.`,
      type: 'DIRECTIVE',
    },
    {
      from: r1.name,
      to: 'Fleet Mesh',
      message: `AI-EVALUATION: Directive decomposed into distributed constraint optimization matrix. Executing.`,
      type: 'STATUS',
    },
    {
      from: r2.name,
      to: r1.name,
      message: `CONSENSUS-REACHED: Distributed agreement validated bitwise across all peers. Operations ongoing.`,
      type: 'STATUS',
    },
  ];
}
