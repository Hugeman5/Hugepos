
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import * as reportRepo from '@/lib/registerReportRepo';
import { z } from 'zod';
import { getSession } from '@/lib/session';


export const dynamic = "force-dynamic";

const closeSchema = z.object({
  notes: z.string().optional(),
  cashActual: z.number().min(0, 'Actual cash cannot be negative'),
});

export async function POST(req: Request) {
  try {
    const user = getSession();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const openShift = await shiftsRepo.getOpenShiftForRegister(user.activeRegisterId || '');
    if (!openShift) {
      return NextResponse.json({ message: "No shift is currently open to close." }, { status: 400 });
    }

    const body = await req.json();
    const validation = closeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }
    
    const { cashActual, notes } = validation.data;
    
    const closedShift = await shiftsRepo.closeShift(openShift.id, cashActual, user, notes);
    
    // Generate the final Z-report for this shift
    const report = await reportRepo.generateAndSaveReport(closedShift, cashActual);
    
    return NextResponse.json({ success: true, shift: closedShift, reportId: report.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to close shift", error: errorMessage }, { status: 500 });
  }
}
