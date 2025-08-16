
import { NextResponse } from 'next/server';
import * as shiftsRepo from '@/lib/shiftsRepo';
import * as reportRepo from '@/lib/registerReportRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const closeSchema = z.object({
  cashActual: z.number().min(0, 'Actual cash cannot be negative'),
  user: z.object({
    id: z.string(),
    name: z.string(),
  })
});

export async function POST(req: Request) {
  try {
    const openShift = await shiftsRepo.getOpenShift();
    if (!openShift) {
      return NextResponse.json({ message: "No shift is currently open to close." }, { status: 400 });
    }

    const body = await req.json();
    const validation = closeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }
    
    const { cashActual, user } = validation.data;
    
    const closedShift = await shiftsRepo.closeShift(openShift.id, cashActual, user);
    const report = await reportRepo.generateAndSaveReport(closedShift, cashActual);
    
    return NextResponse.json({ success: true, shiftId: closedShift.id, reportId: report.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to close shift", error: errorMessage }, { status: 500 });
  }
}
