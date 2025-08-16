
import { NextResponse } from 'next/server';
import { setState } from '@/lib/serviceRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const stateSchema = z.object({
  state: z.enum(["free", "seated", "ordering", "fired", "served", "bill", "dirty"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validation = stateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid state", errors: validation.error.errors }, { status: 400 });
    }
    
    const updatedCheck = await setState(id, validation.data.state);
    return NextResponse.json(updatedCheck);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to update state", error: errorMessage }, { status: 500 });
  }
}
