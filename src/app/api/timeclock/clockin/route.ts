
import { NextRequest, NextResponse } from 'next/server';
import { clockIn } from '@/lib/repos/timeclockRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

function coerceUserId(body: any): string {
  const id = body?.userId ?? body?.user ?? body?.uid ?? body?.waiter ?? body?.jwaiter ?? body?.id;
  return (id == null ? '' : String(id)).trim();
}

const schema = z.object({
  stationId: z.string().optional(),
  role: z.string().optional(),
  hourlyRate: z.number().optional()
});

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  
  const userId = coerceUserId(body);
  if (!userId) return NextResponse.json({ ok: false, error: 'MISSING_USER' }, { status: 400 });

  const { stationId, role, hourlyRate } = schema.parse(body);

  const r = await clockIn(userId, stationId, role, hourlyRate);
  if (!(r as any).ok) return NextResponse.json(r, { status: (r as any).status || 409 });
  return NextResponse.json(r);
}
