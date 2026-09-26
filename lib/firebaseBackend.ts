import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebaseClient';
import type {
  PlatformRobot,
  WorkZone,
  InterRobotMessage,
  CoordinationAlert,
} from '@/types/platform';

export interface FirebaseHealth {
  connected: boolean;
  tablesReady: boolean;
  message: string;
}

// Convert Frontend Robot to Firebase Firestore Document
export function toDbRobot(r: PlatformRobot) {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    battery: r.battery,
    health: r.health,
    speed: r.speed,
    capacity: r.capacity,
    currentLoad: r.currentLoad,
    state: r.state,
    x: Math.round(r.x),
    y: Math.round(r.y),
    targetX: r.targetX != null ? Math.round(r.targetX) : null,
    targetY: r.targetY != null ? Math.round(r.targetY) : null,
    assignedZoneId: r.assignedZoneId || null,
    workProgress: Math.round(r.workProgress || 0),
    workTimeRemaining: Math.round(r.workTimeRemaining || 0),
    labelCode: r.labelCode || null,
    radioRadius: r.radioRadius || 180,
    updatedAt: new Date().toISOString(),
  };
}

// Convert Firebase Firestore Document to Frontend Robot
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
    currentLoad: Number(row.currentLoad ?? row.current_load ?? 0),
    state: row.state,
    x: Number(row.x),
    y: Number(row.y),
    targetX: row.targetX != null ? Number(row.targetX) : (row.target_x != null ? Number(row.target_x) : null),
    targetY: row.targetY != null ? Number(row.targetY) : (row.target_y != null ? Number(row.target_y) : null),
    assignedZoneId: row.assignedZoneId || row.assigned_zone_id || null,
    workProgress: Number(row.workProgress ?? row.work_progress ?? 0),
    workTimeRemaining: Number(row.workTimeRemaining ?? row.work_time_remaining ?? 0),
    labelCode: row.labelCode || row.label_code || row.name?.slice(0, 3) || 'R',
    radioRadius: Number(row.radioRadius ?? row.radio_radius ?? 180),
  };
}

// Convert Frontend Zone to Firebase Firestore Document
export function toDbZone(z: WorkZone) {
  return {
    id: z.id,
    name: z.name,
    x: Math.round(z.x),
    y: Math.round(z.y),
    width: Math.round(z.width),
    height: Math.round(z.height),
    color: z.color,
    taskType: z.taskType,
    difficulty: z.difficulty,
    timeLimitSeconds: z.timeLimitSeconds,
    timeRemainingSeconds: z.timeRemainingSeconds,
    currentResourceLevel: z.currentResourceLevel,
    status: z.status,
    assignedRobotId: z.assignedRobotId || null,
    transportRobotId: z.transportRobotId || null,
    taskCode: z.taskCode || null,
    hazardText: z.hazardText || null,
    updatedAt: new Date().toISOString(),
  };
}

// Convert Firebase Firestore Document to Frontend Zone
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
    taskType: row.taskType || row.task_type,
    difficulty: row.difficulty,
    timeLimitSeconds: Number(row.timeLimitSeconds ?? row.time_limit_seconds ?? 60),
    timeRemainingSeconds: Number(row.timeRemainingSeconds ?? row.time_remaining_seconds ?? 60),
    currentResourceLevel: Number(row.currentResourceLevel ?? row.current_resource_level ?? 0),
    status: row.status,
    assignedRobotId: row.assignedRobotId || row.assigned_robot_id || null,
    transportRobotId: row.transportRobotId || row.transport_robot_id || null,
    taskCode: row.taskCode || row.task_code || undefined,
    hazardText: row.hazardText || row.hazard_text || undefined,
  };
}

// Check Firebase Firestore Health & Connectivity
export async function checkFirebaseHealth(): Promise<FirebaseHealth> {
  try {
    const colRef = collection(db, 'robots');
    const q = query(colRef, limit(1));
    await getDocs(q);
    return {
      connected: true,
      tablesReady: true,
      message: 'Firebase Firestore Connected & Ready',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      connected: false,
      tablesReady: false,
      message: msg,
    };
  }
}

// Fetch all robots from Firebase Firestore
export async function fetchRobots(): Promise<{ data: PlatformRobot[] | null; error: string | null }> {
  try {
    const colRef = collection(db, 'robots');
    const snapshot = await getDocs(colRef);
    const robots: PlatformRobot[] = [];
    snapshot.forEach(docSnap => {
      robots.push(fromDbRobot(docSnap.data()));
    });
    robots.sort((a, b) => a.id.localeCompare(b.id));
    return { data: robots, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch robots from Firebase' };
  }
}

// Save or Update a single robot
export async function upsertRobot(robot: PlatformRobot): Promise<{ success: boolean; error: string | null }> {
  try {
    const data = toDbRobot(robot);
    await setDoc(doc(db, 'robots', robot.id), data, { merge: true });
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to upsert robot in Firebase' };
  }
}

// Delete a robot
export async function deleteRobot(robotId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, 'robots', robotId));
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete robot from Firebase' };
  }
}

// Fetch all zones from Firebase Firestore
export async function fetchZones(): Promise<{ data: WorkZone[] | null; error: string | null }> {
  try {
    const colRef = collection(db, 'zones');
    const snapshot = await getDocs(colRef);
    const zones: WorkZone[] = [];
    snapshot.forEach(docSnap => {
      zones.push(fromDbZone(docSnap.data()));
    });
    zones.sort((a, b) => a.id.localeCompare(b.id));
    return { data: zones, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch zones from Firebase' };
  }
}

// Save or Update a single zone
export async function upsertZone(zone: WorkZone): Promise<{ success: boolean; error: string | null }> {
  try {
    const data = toDbZone(zone);
    await setDoc(doc(db, 'zones', zone.id), data, { merge: true });
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to upsert zone in Firebase' };
  }
}

// Delete a zone
export async function deleteZone(zoneId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, 'zones', zoneId));
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete zone from Firebase' };
  }
}

// Log inter-robot AI message to Firebase Firestore
export async function logMessage(msg: InterRobotMessage): Promise<void> {
  try {
    await setDoc(doc(db, 'messages', msg.id), {
      id: msg.id,
      timestamp: msg.timestamp,
      fromRobot: msg.fromRobot,
      toRobot: msg.toRobot,
      content: msg.content,
      badge: msg.badge || 'STATUS',
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking telemetry
  }
}

// Log coordination alert to Firebase Firestore
export async function logAlert(alert: CoordinationAlert): Promise<void> {
  try {
    await setDoc(doc(db, 'coordination_alerts', alert.id), {
      id: alert.id,
      sourceRobotId: alert.sourceRobotId,
      sourceZoneId: alert.sourceZoneId,
      targetRobotId: alert.targetRobotId,
      targetZoneId: alert.targetZoneId,
      resourceType: alert.resourceType,
      amount: alert.amount,
      message: alert.message,
      status: alert.status,
      assignedTransportRobotId: alert.assignedTransportRobotId || null,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking alert log
  }
}

// Bulk sync full fleet and zones to Firebase Firestore using WriteBatch
export async function bulkSyncFleet(
  robots: PlatformRobot[],
  zones: WorkZone[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const batch = writeBatch(db);

    for (const robot of robots) {
      const rRef = doc(db, 'robots', robot.id);
      batch.set(rRef, toDbRobot(robot), { merge: true });
    }

    for (const zone of zones) {
      const zRef = doc(db, 'zones', zone.id);
      batch.set(zRef, toDbZone(zone), { merge: true });
    }

    await batch.commit();
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Bulk sync to Firebase failed' };
  }
}

// Subscribe to Firebase Firestore real-time snapshot changes across the fleet
export function subscribeToFleet(
  onRobotChange?: (payload: { eventType: string; new?: PlatformRobot; old?: { id: string } }) => void,
  onZoneChange?: (payload: { eventType: string; new?: WorkZone; old?: { id: string } }) => void
) {
  const unsubRobots = onSnapshot(collection(db, 'robots'), snapshot => {
    if (!onRobotChange) return;
    snapshot.docChanges().forEach(change => {
      const robot = fromDbRobot(change.doc.data());
      if (change.type === 'added') {
        onRobotChange({ eventType: 'INSERT', new: robot });
      } else if (change.type === 'modified') {
        onRobotChange({ eventType: 'UPDATE', new: robot });
      } else if (change.type === 'removed') {
        onRobotChange({ eventType: 'DELETE', old: { id: change.doc.id } });
      }
    });
  }, error => {
    console.warn('Firebase Firestore robots subscription warning:', error.message);
  });

  const unsubZones = onSnapshot(collection(db, 'zones'), snapshot => {
    if (!onZoneChange) return;
    snapshot.docChanges().forEach(change => {
      const zone = fromDbZone(change.doc.data());
      if (change.type === 'added') {
        onZoneChange({ eventType: 'INSERT', new: zone });
      } else if (change.type === 'modified') {
        onZoneChange({ eventType: 'UPDATE', new: zone });
      } else if (change.type === 'removed') {
        onZoneChange({ eventType: 'DELETE', old: { id: change.doc.id } });
      }
    });
  }, error => {
    console.warn('Firebase Firestore zones subscription warning:', error.message);
  });

  return () => {
    unsubRobots();
    unsubZones();
  };
}
