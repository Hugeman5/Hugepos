
import { NextRequest, NextResponse } from 'next/server';
import { getStatus } from '@/lib/repos/timeclockRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = decodeURIComponent(String(searchParams.get('userId') || '')).trim();
  if (!userId) return NextResponse.json({ active: false, error: 'MISSING_USER' });
  try { return NextResponse.json(await getStatus(userId)); }
  catch { return NextResponse.json({ active: false }); }
}
