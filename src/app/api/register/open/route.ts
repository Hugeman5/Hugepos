
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import { z } from 'zod';
import { getSession } from '@/lib/session';

export const dynamic = "force-dynamic";

const openShiftSchema = z.object({
  registerId: z.string().min(1, 'Register ID is required'),
  floatAmount: z.number().min(0, 'Float amount cannot be negative'),
});

export async function POST(req: Request) {
  try {
    const user = getSession();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const validation = openShiftSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }

    const { registerId, floatAmount } = validation.data;
    const shift = await shiftsRepo.openShift(registerId, floatAmount, user);
    
    return NextResponse.json({ success: true, shift });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.includes("already open")) {
        return NextResponse.json({ message: errorMessage }, { status: 409 });
    }
    return NextResponse.json({ message: "Failed to open shift", error: errorMessage }, { status: 500 });
  }
}
