import { NextResponse } from 'next/server';
import { closeRegister } from '@/lib/repos/registerRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  declaredCash: z.number().min(0),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await closeRegister(validation.data.userId, validation.data.declaredCash, validation.data.notes);
    if (!result.ok) {
        return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
