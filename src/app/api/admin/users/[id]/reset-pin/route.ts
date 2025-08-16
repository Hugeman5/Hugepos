
import { NextResponse } from 'next/server';
import { resetPin } from '@/lib/usersRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits')
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    const body = await req.json();
    const validation = pinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid PIN format", errors: validation.error.errors }, { status: 400 });
    }
    
    const result = await resetPin(id, validation.data.pin);

    if (!result.success) {
        return NextResponse.json({ message: `User with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to reset PIN", error: errorMessage }, { status: 500 });
  }
}
