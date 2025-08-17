
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';

export const dynamic = "force-dynamic";

const moveLineSchema = z.object({
  lineId: z.string(),
  fromOrderId: z.string(),
  toOrderId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = moveLineSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { lineId, fromOrderId, toOrderId } = validation.data;

    await ordersRepo.moveLine(lineId, fromOrderId, toOrderId);

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to move line item", error: errorMessage }, { status: 500 });
  }
}
