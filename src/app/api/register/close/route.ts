
import { NextResponse } from 'next/server';
import { closeShift } from '@/lib/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
    }
    const shift = await closeShift(validation.data.userId, validation.data.notes);
    return NextResponse.json(shift);
  } catch (e) {
    const error = e as Error;
    const status = error.message.includes("not open") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
