export type RobotRole =
  | 'WATER_COLLECTOR'
  | 'PLANTER'
  | 'TRANSPORTER'
  | 'CLEANER'
  | 'HEAVY_LIFTER'
  | 'GENERAL';

export type RobotPlatformState =
  | 'IDLE'
  | 'TRAVELLING'
  | 'WORKING'
  | 'CHARGING'
  | 'RETURNING'
  | 'FAILED';

export interface PlatformRobot {
  id: string;
  name: string;
  role: RobotRole;
  battery: number;       // 0 - 100
  health: number;        // 0 - 100
  speed: number;         // 1 - 6
  capacity: number;      // max kg or liters
  currentLoad: number;   // current resource payload
  state: RobotPlatformState;
  x: number;
  y: number;
  targetX?: number | null;
  targetY?: number | null;
  assignedZoneId?: string | null;
  workProgress: number;  // 0 - 100 %
  workTimeRemaining: number; // in seconds
  labelCode?: string;
  radioRadius?: number;
}

export type ZoneTaskType =
  | 'WATER_WASTE'
  | 'TREE_PLANTING'
  | 'CLEANING'
  | 'DELIVERY'
  | 'INSPECTION';

export type ZoneStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE';

export interface WorkZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  taskType: ZoneTaskType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitSeconds: number;
  timeRemainingSeconds: number;
  resourceRequired?: { type: string; amount: number };
  resourceProduced?: { type: string; amount: number };
  currentResourceLevel: number;
  status: ZoneStatus;
  assignedRobotId: string | null;
  transportRobotId?: string | null;
  taskCode?: string;
  hazardText?: string;
}

export interface CoordinationAlert {
  id: string;
  sourceRobotId: string;
  sourceZoneId: string;
  targetRobotId: string;
  targetZoneId: string;
  resourceType: string;
  amount: number;
  message: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'RESOLVED';
  assignedTransportRobotId?: string | null;
}

export interface InterRobotMessage {
  id: string;
  timestamp: string;
  fromRobot: string;
  toRobot: string;
  content: string;
  badge?: 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT';
}
