
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import * as registersRepo from '@/lib/registersRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const registerId = searchParams.get('registerId');

    let openShift: shiftsRepo.Shift | null;

    if (registerId) {
        openShift = await shiftsRepo.getOpenShiftForRegister(registerId);
    } else {
        // Fallback for components that don't specify a register (like general header)
        // This might need refinement based on business logic, but for now, returns any open shift.
        const shifts = await shiftsRepo.getAllShifts();
        openShift = shifts.find(s => s.status === 'open') || null;
    }

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
