
import { NextResponse } from 'next/server';
import { updateTable, removeTable } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const updateTableSchema = z.object({
    areaId: z.string().optional(),
    name: z.string().optional(),
    seats: z.number().int().min(1).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    shape: z.enum(['square', 'round']).optional(),
});


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validation = updateTableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid table data", errors: validation.error.errors }, { status: 400 });
    }
    
    const updatedTable = await updateTable(id, validation.data);
    return NextResponse.json(updatedTable);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to update table", error: errorMessage }, { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await removeTable(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to delete table", error: errorMessage }, { status: 500 });
  }
}
