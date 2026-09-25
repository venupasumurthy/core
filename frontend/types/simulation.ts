export interface RobotData {
  id: string;
  x: number;
  y: number;
  state: 'IDLE' | 'MOVING' | 'WORKING' | 'CHARGING' | 'FAILED';
  battery: number;
  task_id: string | null;
  robot_type?: 'SCOUT' | 'TRANSPORTER' | 'HEAVY_LIFTER';
  speed?: number;
  load_capacity?: number;
  target_x?: number | null;
  target_y?: number | null;
  comm_active?: boolean;
  tasks_completed?: number;
  yielding_to?: string | null;
}

export interface TaskData {
  id: string;
  x: number;
  y: number;
  priority: number;
  required_capacity?: number;
  assigned_to: string | null;
  completed: boolean;
}

export interface ChargingStation {
  id: string;
  x: number;
  y: number;
  capacity?: number;
  occupied?: number;
}

export interface Metrics {
  tasks_completed: number;
  conflicts_resolved: number;
  deadlocks_resolved: number;
  robots_failed: number;
  robots_charging: number;
  controller_online?: number;
}

export interface SimSnapshot {
  tick: number;
  controller_online?: boolean;
  robots: RobotData[];
  tasks: TaskData[];
  charging_stations: ChargingStation[];
  metrics: Metrics;
  event_log: string[];
  running: boolean;
}

export type SimAction =
  | { action: 'reset'; n_robots: number; n_tasks: number; world_size: number }
  | { action: 'resume' }
  | { action: 'pause' }
  | { action: 'step'; ticks: number }
  | { action: 'inject_failure' }
  | { action: 'inject_comm_loss' }
  | { action: 'inject_controller_failure' }
  | { action: 'restore_controller' }
  | { action: 'toggle_controller' }
  | { action: 'restore_all' };

