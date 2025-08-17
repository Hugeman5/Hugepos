
import { NextResponse } from 'next/server';
import { bumpTicket } from '@/lib/kdsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  ticketId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }
    
    await bumpTicket(validation.data.ticketId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: "Failed to bump ticket", error: (e as Error).message }, { status: 500 });
  }
}
