
import { NextResponse } from 'next/server';
import { getAllShifts } from '@/lib/shiftsRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    const shifts = await getAllShifts();
    const recentShifts = shifts.slice(0, limit);

    return NextResponse.json(recentShifts);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch recent shifts", error: errorMessage }, { status: 500 });
  }
}
