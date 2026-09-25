import { supabase } from './supabaseClient';
import type {
  PlatformRobot,
  WorkZone,
  InterRobotMessage,
  CoordinationAlert,
} from '@/types/platform';

export interface SupabaseHealth {
  connected: boolean;
  tablesReady: boolean;
  message: string;
}

// Convert Frontend Robot to Supabase DB Row
export function toDbRobot(r: PlatformRobot) {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    battery: r.battery,
    health: r.health,
    speed: r.speed,
    capacity: r.capacity,
    current_load: r.currentLoad,
    state: r.state,
    x: Math.round(r.x),
    y: Math.round(r.y),
    target_x: r.targetX != null ? Math.round(r.targetX) : null,
    target_y: r.targetY != null ? Math.round(r.targetY) : null,
    assigned_zone_id: r.assignedZoneId || null,
    work_progress: Math.round(r.workProgress || 0),
    work_time_remaining: Math.round(r.workTimeRemaining || 0),
    label_code: r.labelCode || null,
    radio_radius: r.radioRadius || 180,
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase DB Row to Frontend Robot
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDbRobot(row: any): PlatformRobot {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    battery: Number(row.battery),
    health: Number(row.health),
    speed: Number(row.speed || 1.8),
    capacity: Number(row.capacity || 50),
    currentLoad: Number(row.current_load || 0),
    state: row.state,
    x: Number(row.x),
    y: Number(row.y),
    targetX: row.target_x != null ? Number(row.target_x) : null,
    targetY: row.target_y != null ? Number(row.target_y) : null,
    assignedZoneId: row.assigned_zone_id || null,
    workProgress: Number(row.work_progress || 0),
    workTimeRemaining: Number(row.work_time_remaining || 0),
    labelCode: row.label_code || row.name.slice(0, 3),
    radioRadius: Number(row.radio_radius || 180),
  };
}

// Convert Frontend Zone to Supabase DB Row
export function toDbZone(z: WorkZone) {
  return {
    id: z.id,
    name: z.name,
    x: Math.round(z.x),
    y: Math.round(z.y),
    width: Math.round(z.width),
    height: Math.round(z.height),
    color: z.color,
    task_type: z.taskType,
    difficulty: z.difficulty,
    time_limit_seconds: z.timeLimitSeconds,
    time_remaining_seconds: z.timeRemainingSeconds,
    current_resource_level: z.currentResourceLevel,
    status: z.status,
    assigned_robot_id: z.assignedRobotId || null,
    transport_robot_id: z.transportRobotId || null,
    task_code: z.taskCode || null,
    hazard_text: z.hazardText || null,
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase DB Row to Frontend Zone
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDbZone(row: any): WorkZone {
  return {
    id: row.id,
    name: row.name,
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    color: row.color,
    taskType: row.task_type,
    difficulty: row.difficulty,
    timeLimitSeconds: Number(row.time_limit_seconds),
    timeRemainingSeconds: Number(row.time_remaining_seconds),
    currentResourceLevel: Number(row.current_resource_level || 0),
    status: row.status,
    assignedRobotId: row.assigned_robot_id || null,
    transportRobotId: row.transport_robot_id || null,
    taskCode: row.task_code || undefined,
    hazardText: row.hazard_text || undefined,
  };
}

// Check Supabase Connectivity and Table Readiness
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  try {
    const { error } = await supabase.from('robots').select('id').limit(1);
    if (!error) {
      return { connected: true, tablesReady: true, message: 'Supabase Cloud Connected & Ready' };
    }
    if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
      return {
        connected: true,
        tablesReady: false,
        message: 'Connected to Supabase. Execute supabase_schema.sql to create tables.',
      };
    }
    return { connected: false, tablesReady: false, message: error.message };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { connected: false, tablesReady: false, message: msg };
  }
}

// Fetch all robots from Supabase
export async function fetchRobots(): Promise<{ data: PlatformRobot[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('robots')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: (data || []).map(fromDbRobot), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch robots' };
  }
}

// Save or Update a single robot
export async function upsertRobot(robot: PlatformRobot): Promise<{ success: boolean; error: string | null }> {
  try {
    const row = toDbRobot(robot);
    const { error } = await supabase.from('robots').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to upsert robot' };
  }
}

// Delete a robot
export async function deleteRobot(robotId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('robots').delete().eq('id', robotId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete robot' };
  }
}

// Fetch all zones from Supabase
export async function fetchZones(): Promise<{ data: WorkZone[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('id', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data || []).map(fromDbZone), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch zones' };
  }
}

// Save or Update a single zone
export async function upsertZone(zone: WorkZone): Promise<{ success: boolean; error: string | null }> {
  try {
    const row = toDbZone(zone);
    const { error } = await supabase.from('zones').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to upsert zone' };
  }
}

// Delete a zone
export async function deleteZone(zoneId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete zone' };
  }
}

// Log inter-robot AI message to Supabase
export async function logMessage(msg: InterRobotMessage): Promise<void> {
  try {
    await supabase.from('messages').insert({
      id: msg.id,
      timestamp: msg.timestamp,
      from_robot: msg.fromRobot,
      to_robot: msg.toRobot,
      content: msg.content,
      badge: msg.badge || 'STATUS',
    });
  } catch {
    // Non-blocking telemetry
  }
}

// Log coordination alert to Supabase
export async function logAlert(alert: CoordinationAlert): Promise<void> {
  try {
    await supabase.from('coordination_alerts').insert({
      id: alert.id,
      source_robot_id: alert.sourceRobotId,
      source_zone_id: alert.sourceZoneId,
      target_robot_id: alert.targetRobotId,
      target_zone_id: alert.targetZoneId,
      resource_type: alert.resourceType,
      amount: alert.amount,
      message: alert.message,
      status: alert.status,
      assigned_transport_robot_id: alert.assignedTransportRobotId || null,
    });
  } catch {
    // Non-blocking alert log
  }
}

// Bulk sync full fleet and zones to Supabase
export async function bulkSyncFleet(
  robots: PlatformRobot[],
  zones: WorkZone[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const robotRows = robots.map(toDbRobot);
    const zoneRows = zones.map(toDbZone);

    const [rRes, zRes] = await Promise.all([
      supabase.from('robots').upsert(robotRows, { onConflict: 'id' }),
      supabase.from('zones').upsert(zoneRows, { onConflict: 'id' }),
    ]);

    if (rRes.error) return { success: false, error: rRes.error.message };
    if (zRes.error) return { success: false, error: zRes.error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Bulk sync failed' };
  }
}

// Subscribe to Supabase Realtime changes across the fleet
export function subscribeToFleet(
  onRobotChange?: (payload: { eventType: string; new?: PlatformRobot; old?: { id: string } }) => void,
  onZoneChange?: (payload: { eventType: string; new?: WorkZone; old?: { id: string } }) => void
) {
  const channel = supabase
    .channel('core-fleet-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'robots' },
      payload => {
        if (!onRobotChange) return;
        const newRobot = payload.new && Object.keys(payload.new).length > 0 ? fromDbRobot(payload.new) : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldId = (payload.old as any)?.id ? { id: (payload.old as any).id } : undefined;
        onRobotChange({ eventType: payload.eventType, new: newRobot, old: oldId });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'zones' },
      payload => {
        if (!onZoneChange) return;
        const newZone = payload.new && Object.keys(payload.new).length > 0 ? fromDbZone(payload.new) : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldId = (payload.old as any)?.id ? { id: (payload.old as any).id } : undefined;
        onZoneChange({ eventType: payload.eventType, new: newZone, old: oldId });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
