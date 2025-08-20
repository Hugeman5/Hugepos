import { NextResponse } from 'next/server';
import { recordPayment } from '@/lib/repos/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  orderId: z.string().min(1),
  method: z.enum(['CASH', 'CARD', 'OTHER']),
  amount: z.number(),
  paidAt: z.string().datetime().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const result = await recordPayment(validation.data.orderId, validation.data.method, validation.data.amount, validation.data.paidAt);
    if (!result.ok) {
        return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
