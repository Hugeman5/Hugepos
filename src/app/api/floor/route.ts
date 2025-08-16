
import { NextResponse } from 'next/server';
import { getFloor } from '@/lib/floorRepo';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const floorPlan = await getFloor();
    return NextResponse.json(floorPlan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch floor plan", error: errorMessage }, { status: 500 });
  }
}
