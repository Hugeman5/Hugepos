
import { NextResponse, type NextRequest } from 'next/server';
import { getStatus } from '@/lib/repos/timeclockRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = decodeURIComponent(String(searchParams.get('userId') || '')).trim();
  if (!userId) {
    return NextResponse.json({ active: false, error: 'MISSING_USER' });
  }
  try {
    const st = await getStatus(userId);
    return NextResponse.json(st);
  } catch (e) {
    // File missing or parse error -> be conservative but NEVER 500
    return NextResponse.json({ active: false });
  }
}
