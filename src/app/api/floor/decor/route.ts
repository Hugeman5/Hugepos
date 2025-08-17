
import { NextResponse } from 'next/server';
import { addDecor } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const addDecorSchema = z.object({
    asset: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = addDecorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid decor data", errors: validation.error.errors }, { status: 400 });
    }
    
    const newDecor = await addDecor(validation.data);
    return NextResponse.json(newDecor, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to add decor item", error: errorMessage }, { status: 500 });
  }
}
