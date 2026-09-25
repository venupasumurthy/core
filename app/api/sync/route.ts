import { NextResponse } from 'next/server';
import { bulkSyncFleet } from '@/lib/supabaseBackend';
import type { PlatformRobot, WorkZone } from '@/types/platform';

export async function POST(req: Request) {
  try {
    const { robots, zones }: { robots: PlatformRobot[]; zones: WorkZone[] } = await req.json();
    if (!robots || !zones) {
      return NextResponse.json(
        { success: false, error: 'Both robots and zones arrays are required' },
        { status: 400 }
      );
    }
    const result = await bulkSyncFleet(robots, zones);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      syncedRobots: robots.length,
      syncedZones: zones.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
