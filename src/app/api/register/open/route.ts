

import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const openShiftSchema = z.object({
  registerId: z.string().min(1, 'Register ID is required'),
  floatAmount: z.number().min(0, 'Float amount cannot be negative'),
  user: z.object({
      id: z.string(),
      name: z.string()
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = openShiftSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }

    const { registerId, floatAmount, user } = validation.data;
    
    const existingShift = await shiftsRepo.getOpenShiftForRegister(registerId);
    if (existingShift) {
        return NextResponse.json({ message: `Shift ${existingShift.id} is already open on register ${existingShift.registerId}.`}, { status: 409 });
    }

    const shift = await shiftsRepo.openShift(registerId, floatAmount, user);
    
    return NextResponse.json({ success: true, shift });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to open shift", error: errorMessage }, { status: 500 });
  }
}
