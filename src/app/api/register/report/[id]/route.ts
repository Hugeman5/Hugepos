'use server';

import { NextResponse } from 'next/server';
import * as reportRepo from '@/lib/registerReportRepo';

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
        return NextResponse.json({ message: 'Report ID is required' }, { status: 400 });
    }

    const report = await reportRepo.getReport(reportId);
    
    if (!report) {
        return NextResponse.json({ message: `Report ${reportId} not found` }, { status: 404 });
    }

    return NextResponse.json(report);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch report", error: errorMessage }, { status: 500 });
  }
}
