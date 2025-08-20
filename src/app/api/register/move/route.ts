import { NextResponse } from 'next/server';
import { moveCash } from '@/lib/repos/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  type: z.enum(['IN', 'OUT']),
  amount: z.number().positive(),
  reason: z.string().min(1, 'A reason is required for cash movements.'),
  by: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await moveCash(validation.data.by, validation.data.type, validation.data.amount, validation.data.reason);
    if (!result.ok) {
        return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
