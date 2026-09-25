import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabaseBackend';
import { SUPABASE_URL } from '@/lib/supabaseClient';

export async function GET() {
  const t0 = Date.now();
  const health = await checkSupabaseHealth();
  const latency = Date.now() - t0;

  return NextResponse.json({
    status: health.connected ? 'online' : 'degraded',
    service: 'CORE Autonomous Fleet Backend',
    supabaseUrl: SUPABASE_URL,
    tablesReady: health.tablesReady,
    message: health.message,
    latencyMs: latency,
    timestamp: new Date().toISOString(),
  });
}
