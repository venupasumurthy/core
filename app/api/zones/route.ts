import { NextResponse } from 'next/server';
import { fetchZones, upsertZone, deleteZone } from '@/lib/firebaseBackend';
import type { WorkZone } from '@/types/platform';

export async function GET() {
  const { data, error } = await fetchZones();
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: data?.length || 0, data });
}

export async function POST(req: Request) {
  try {
    const body: WorkZone = await req.json();
    if (!body || !body.id || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Invalid zone payload: id and name required' },
        { status: 400 }
      );
    }
    const result = await upsertZone(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, zone: body });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Zone ID parameter missing' }, { status: 400 });
    }
    const result = await deleteZone(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
