
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import { getSession } from '@/lib/session';
import { getRegister } from '@/lib/registersRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const registerId = searchParams.get('registerId');
    
    const user = getSession();
    const targetRegisterId = registerId || user?.activeRegisterId;
    
    if (!targetRegisterId) {
        return NextResponse.json({ isOpen: false, current: null });
    }

    const openShift = await shiftsRepo.getOpenShiftForRegister(targetRegisterId);
    
    if (openShift) {
        const register = await getRegister(targetRegisterId);
        return NextResponse.json({ 
            isOpen: true, 
            current: {
                ...openShift,
                registerName: register?.name || targetRegisterId
            } 
        });
    }

    return NextResponse.json({ isOpen: false, current: null });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to get shift status", error: errorMessage }, { status: 500 });
  }
}
