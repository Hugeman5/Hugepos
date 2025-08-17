
import { NextResponse } from 'next/server';
import { updateDecor, removeDecor } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const updateDecorSchema = z.object({
    asset: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
});


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validation = updateDecorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid decor data", errors: validation.error.errors }, { status: 400 });
    }
    
    const updatedDecor = await updateDecor(id, validation.data);
    return NextResponse.json(updatedDecor);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to update decor item", error: errorMessage }, { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await removeDecor(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to delete decor item", error: errorMessage }, { status: 500 });
  }
}
