import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/repos/timeclockRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ active: false, error: 'MISSING_USER' }, { status: 400 });
    }
    // This will now never throw on missing file, will return {active:false}
    const status = await getStatus(userId);
    return NextResponse.json(status);
  } catch (e) {
    // Should not be reached with the new repo logic, but as a safeguard:
    console.error('[API /timeclock/status]', e);
    return NextResponse.json({ active: false, error: (e as Error).message }, { status: 500 });
  }
}
