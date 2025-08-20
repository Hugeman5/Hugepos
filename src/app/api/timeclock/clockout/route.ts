
import { NextResponse } from 'next/server';
import { clockOut } from '@/lib/repos/timeclockRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const userId = String(body?.userId ?? body?.user ?? '').trim();
  if (!userId) return NextResponse.json({ ok: false, error: 'MISSING_USER' }, { status: 400 });
  const r = await clockOut(userId);
  const status = (r as any).ok ? 200 : ((r as any).status ?? 409);
  return NextResponse.json(r, { status });
}
