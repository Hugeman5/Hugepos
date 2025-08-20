import { NextResponse } from 'next/server';
import { openShift } from '@/lib/shiftsRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  registerId: z.string().min(1, 'Register ID is required.'),
  openingFloat: z.number().min(0, 'Float must be non-negative.'),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { registerId, openingFloat, user, notes } = validation.data;
    const result = await openShift(registerId, openingFloat, user, notes);
    
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
     if (error.message.includes('already open')) {
        return NextResponse.json({ ok: false, error: 'REGISTER_ALREADY_OPEN' }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
