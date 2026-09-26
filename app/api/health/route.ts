import { NextResponse } from 'next/server';
import { checkFirebaseHealth } from '@/lib/firebaseBackend';
import { firebaseConfig } from '@/lib/firebaseClient';

export async function GET() {
  const t0 = Date.now();
  const health = await checkFirebaseHealth();
  const latency = Date.now() - t0;

  return NextResponse.json({
    status: health.connected ? 'online' : 'ready',
    service: 'CORE Autonomous Fleet Backend (Firebase Firestore)',
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    connected: health.connected,
    tablesReady: health.tablesReady,
    message: health.message,
    latencyMs: latency,
    timestamp: new Date().toISOString(),
  });
}
