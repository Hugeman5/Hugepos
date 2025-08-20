import { NextResponse } from 'next/server';
import { clockIn } from '@/lib/repos/timeclockRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  stationId: z.string().optional(),
  role: z.string().optional(),
  hourlyRate: z.number().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 });
    }
    const { userId, stationId, role, hourlyRate } = validation.data;
    const result = await clockIn(userId, stationId, role, hourlyRate);
    if (!result.ok) {
        return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
