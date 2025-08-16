
import { NextResponse } from 'next/server';
import { updateArea, removeArea } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const updateAreaSchema = z.object({
    name: z.string().optional(),
    color: z.string().optional(),
    order: z.number().int().optional(),
});


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validation = updateAreaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid area data", errors: validation.error.errors }, { status: 400 });
    }
    
    const updatedArea = await updateArea(id, validation.data);
    return NextResponse.json(updatedArea);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to update area", error: errorMessage }, { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await removeArea(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to delete area", error: errorMessage }, { status: 500 });
  }
}
