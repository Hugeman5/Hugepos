
import { NextResponse } from 'next/server';
import { addTable } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const addTableSchema = z.object({
    areaId: z.string(),
    name: z.string(),
    seats: z.number().int().min(1),
    x: z.number(),
    y: z.number(),
    shape: z.enum(['square', 'round']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = addTableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid table data", errors: validation.error.errors }, { status: 400 });
    }
    
    const newTable = await addTable(validation.data);
    return NextResponse.json(newTable, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to add table", error: errorMessage }, { status: 500 });
  }
}
