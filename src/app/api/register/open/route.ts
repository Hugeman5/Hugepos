
import { NextResponse } from 'next/server';
import { openRegister } from '@/lib/repos/registerRepo';
import { getStatus as getTimeclockStatus } from '@/lib/repos/timeclockRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  userName: z.string().min(1, 'User name is required.'),
  openingFloat: z.number().min(0, 'Float must be non-negative.'),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId, userName, openingFloat, notes } = validation.data;

    // Gate: User must be clocked in
    try {
      const tc = await getTimeclockStatus(userId);
      if (!tc.active) return NextResponse.json({ ok: false, error: 'NOT_CLOCKED_IN' }, { status: 403 });
    } catch {
      return NextResponse.json({ ok: false, error: 'NOT_CLOCKED_IN' }, { status: 403 });
    }

    const result = await openRegister(userId, userName, openingFloat, notes);
    if (!result.ok) {
        return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
