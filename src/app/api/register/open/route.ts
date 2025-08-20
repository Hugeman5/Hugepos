
import { NextResponse } from 'next/server';
import { openShift } from '@/lib/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  floatAmount: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const shift = await openShift(validation.data.userId, validation.data.floatAmount);
    return NextResponse.json(shift);
  } catch (e) {
    const error = e as Error;
    const status = error.message.includes("already open") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
