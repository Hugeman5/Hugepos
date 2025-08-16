
import { NextResponse } from 'next/server';
import { addArea } from '@/lib/floorRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const addAreaSchema = z.object({
    name: z.string(),
    color: z.string(),
    order: z.number().int(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = addAreaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid area data", errors: validation.error.errors }, { status: 400 });
    }
    
    const newArea = await addArea(validation.data);
    return NextResponse.json(newArea, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to add area", error: errorMessage }, { status: 500 });
  }
}
