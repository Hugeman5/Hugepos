
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import { z } from 'zod';
import { getSession } from '@/lib/session';

export const dynamic = "force-dynamic";

const cashMoveSchema = z.object({
  type: z.enum(['payin', 'payout']),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(req: Request) {
  try {
    const user = getSession();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const openShift = await shiftsRepo.getOpenShiftForRegister(user.activeRegisterId || '');
    if (!openShift) {
      return NextResponse.json({ message: "No shift is currently open." }, { status: 409 });
    }

    const body = await req.json();
    const validation = cashMoveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }

    const { type, amount, reason } = validation.data;

    const updatedShift = await shiftsRepo.addCashMove({
      shiftId: openShift.id,
      type,
      amount,
      reason,
      userId: user.id,
      userName: user.name,
    });
    
    return NextResponse.json(updatedShift);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to record cash movement", error: errorMessage }, { status: 500 });
  }
}
