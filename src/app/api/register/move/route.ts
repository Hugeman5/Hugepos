
import { NextResponse } from 'next/server';
import { addCashMove } from '@/lib/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  type: z.enum(['in', 'out']),
  amount: z.number().positive(),
  reason: z.string().min(1, 'A reason is required for cash movements.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const shift = await addCashMove(validation.data);
    return NextResponse.json(shift);
  } catch (e) {
    const error = e as Error;
    const status = error.message.includes("No shift is open") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
