export type RobotRole = 'SCOUT' | 'TRANSPORTER' | 'HEAVY_LIFTER';
export type RobotState = 'IDLE' | 'MOVING' | 'WORKING' | 'CHARGING' | 'FAILED';
export type ArchitectureMode = 'CENTRALIZED' | 'DECENTRALIZED_P2P';

export interface TaskExecutionRecord {
  taskId: string;
  success: boolean;
  predictedTicks: number;
  actualTicks: number;
  predictedEnergy: number;
  actualEnergy: number;
  completedAtTick: number;
}

export interface BidFactorBreakdown {
  capability: number;
  distance: number;
  workload: number;
  battery: number;
  priority: number;
  eta: number;
  health: number;
  commQuality: number;
  reliability: number;
  riskPenalty: number;
}

export interface BidRecord {
  robotId: string;
  factors: BidFactorBreakdown;
  totalScore: number;
  bidTimestamp: number;
}

export interface AuctionDecisionRecord {
  taskId: string;
  tick: number;
  mode: ArchitectureMode;
  winnerId: string;
  backupWinnerId: string | null;
  explanation: string;
  bids: BidRecord[];
}

export interface RobotData {
  id: string;
  x: number;
  y: number;
  state: RobotState;
  battery: number;
  health: number;
  speed: number;
  load_capacity: number;
  current_load?: number;
  task_id: string | null;
  backup_task_id?: string | null;
  robot_type: RobotRole;
  target_x: number | null;
  target_y: number | null;
  comm_active: boolean;
  comm_quality: number; // 0.0 - 1.0
  radio_radius: number; // px
  tasks_completed: number;
  tasks_failed: number;
  yielding_to: string | null;
  reputation: number; // 0.0 - 1.0 Bayesian track record
  predicted_energy_delta?: number;
  actual_energy_delta?: number;
  task_history?: TaskExecutionRecord[];
  assigned_tick?: number;
}

export interface TaskData {
  id: string;
  x: number;
  y: number;
  priority: number; // 1 - 10
  required_capacity: number;
  required_role?: RobotRole;
  assigned_to: string | null; // Primary Contract
  backup_assigned_to: string | null; // Backup Contract
  completed: boolean;
  created_tick: number;
  assigned_tick?: number;
  ticks_remaining?: number;
  latest_auction?: AuctionDecisionRecord;
  preempted?: boolean;
}

export interface ChargingStation {
  id: string;
  x: number;
  y: number;
  capacity: number;
  occupied: number;
  online: boolean;
}

export interface CorridorObstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  label: string;
}

export interface Metrics {
  tasks_completed: number;
  tasks_failed: number;
  conflicts_resolved: number;
  deadlocks_resolved: number;
  robots_failed: number;
  robots_charging: number;
  controller_online: number;
  architecture_mode: ArchitectureMode;
  p2p_messages_exchanged: number;
  backup_handovers_executed: number;
  average_reputation: number;
  avg_task_latency: number;
  network_bandwidth_kbps: number;
  active_fleet_count: number;
}

export interface SimSnapshot {
  tick: number;
  controller_online: boolean;
  architecture_mode: ArchitectureMode;
  robots: RobotData[];
  tasks: TaskData[];
  charging_stations: ChargingStation[];
  obstacles: CorridorObstacle[];
  metrics: Metrics;
  event_log: string[];
  recent_decisions: AuctionDecisionRecord[];
  running: boolean;
  info_quality: number; // 0.2 - 1.0
  jury_step?: {
    stepIndex: number;
    title: string;
    description: string;
    active: boolean;
  } | null;
}

export type SimAction =
  | { action: 'reset'; n_robots: number; n_tasks: number; world_size: number }
  | { action: 'resume' }
  | { action: 'pause' }
  | { action: 'step'; ticks: number }
  | { action: 'inject_failure'; robot_id?: string }
  | { action: 'inject_comm_loss'; robot_id?: string }
  | { action: 'inject_low_battery'; robot_id?: string }
  | { action: 'inject_corridor_block'; obstacle_id?: string }
  | { action: 'inject_charger_failure'; station_id?: string }
  | { action: 'inject_task_surge'; count?: number }
  | { action: 'inject_deadlock' }
  | { action: 'inject_emergency_task' }
  | { action: 'inject_controller_failure' }
  | { action: 'restore_controller' }
  | { action: 'toggle_controller' }
  | { action: 'restore_all' }
  | { action: 'break_the_fleet' }
  | { action: 'set_info_quality'; quality: number }
  | { action: 'run_what_if'; scenario: 'BATTERY_CRISIS' | 'SURGE_OFFLINE' | 'HEAVY_LIFTER_LOSS' | 'JAMMING' }
  | { action: 'start_jury_demo' }
  | { action: 'step_jury_demo' }
  | { action: 'stop_jury_demo' };
