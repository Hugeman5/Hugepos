
import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/repos/timeclockRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = decodeURIComponent(String(searchParams.get("userId") || '')).trim();

    if (!userId) {
      // Return 200 with inactive to avoid UI showing "unavailable"
      return NextResponse.json({ active: false, error: 'MISSING_USER' });
    }
    
    const status = await getStatus(userId);
    return NextResponse.json(status);

  } catch (e) {
    // File missing or parse error → be conservative but NEVER 500
    return NextResponse.json({ active: false });
  }
}
