'use server';
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import * as registersRepo from '@/lib/registersRepo';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const openShift = await shiftsRepo.getOpenShift();
    if (!openShift) {
      return NextResponse.json(null, { status: 404 });
    }
    
    const register = await registersRepo.getRegister(openShift.registerId);

    return NextResponse.json({
        ...openShift,
        registerName: register?.name || openShift.registerId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to get open shift", error: errorMessage }, { status: 500 });
  }
}
