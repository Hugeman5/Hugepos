'use server';

import { NextResponse } from 'next/server';
import * as cashRepo from '@/lib/cashRepo';
import * as shiftsRepo from '@/lib/shiftsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const cashMoveSchema = z.object({
  type: z.enum(['payin', 'payout']),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  user: z.object({
      id: z.string(),
      name: z.string()
  }),
});

export async function POST(req: Request) {
  try {
    const openShift = await shiftsRepo.getOpenShift();
    if (!openShift) {
      return NextResponse.json({ message: "No shift is currently open." }, { status: 400 });
    }

    const body = await req.json();
    const validation = cashMoveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }

    const { type, amount, reason, user } = validation.data;

    const movement = await cashRepo.addMovement({
      shiftId: openShift.id,
      type,
      amount,
      reason,
      userId: user.id,
      userName: user.name,
    });
    
    // Update the shift's expected cash amount
    if (type === 'payin') {
        openShift.cashExpected = (openShift.cashExpected || 0) + amount;
    } else {
        openShift.cashExpected = (openShift.cashExpected || 0) - amount;
    }
    await shiftsRepo.saveShift(openShift);
    

    return NextResponse.json({ success: true, movement });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to record cash movement", error: errorMessage }, { status: 500 });
  }
}
