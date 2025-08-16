
import { NextResponse } from 'next/server';
import { openCheck, listOpen } from '@/lib/serviceRepo';
import { getFloor } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const openCheckSchema = z.object({
  tableId: z.string(),
  server: z.object({ uid: z.string(), name: z.string() }),
  guests: z.number().int().min(1).optional(),
  shiftId: z.string().optional(),
});


export async function GET() {
  try {
    const checks = await listOpen();
    return NextResponse.json(checks);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to list open checks", error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = openCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }
    
    const { tableId, server, guests, shiftId } = validation.data;
    
    const floor = await getFloor();
    const table = floor.tables.find(t => t.id === tableId);
    if (!table) {
        return NextResponse.json({ message: "Table not found" }, { status: 404 });
    }
    
    const newCheck = await openCheck(table, server, guests || 1, shiftId);
    return NextResponse.json(newCheck, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to open check", error: errorMessage }, { status: 500 });
  }
}
