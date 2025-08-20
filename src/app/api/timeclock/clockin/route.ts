
import { NextRequest, NextResponse } from 'next/server';
import { clockIn } from '@/lib/repos/timeclockRepo';

function coerceUserId(body: any): string {
  const id = body?.userId ?? body?.user ?? body?.uid ?? body?.waiter ?? body?.jwaiter;
  return (id == null ? '' : String(id)).trim();
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const userId = coerceUserId(body);
  if (!userId) return NextResponse.json({ ok: false, error: 'MISSING_USER' }, { status: 400 });

  const stationId = typeof body?.stationId === 'string' ? body.stationId : undefined;
  const role = typeof body?.role === 'string' ? body.role : undefined;
  const rate = Number.isFinite(Number(body?.hourlyRate)) ? Number(body.hourlyRate) : 0;

  const r = await clockIn(userId, stationId, role, rate);
  const status = (r as any).ok ? 200 : ((r as any).status ?? 409);
  return NextResponse.json(r, { status });
}
