
import { NextResponse } from 'next/server';
import { deleteUser, getUserById, upsertUser } from '@/lib/usersRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  hourlyRate: z.number().min(0),
});


export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        if (!id) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }
        
        const body = await req.json();
        const validation = patchSchema.safeParse(body);
        if(!validation.success) {
            return NextResponse.json({ message: 'Invalid data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const user = await getUserById(id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        
        user.hourlyRate = validation.data.hourlyRate;
        await upsertUser(user);

        return NextResponse.json({ success: true, user });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to update hourly rate", error: errorMessage }, { status: 500 });
    }
}


export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const result = await deleteUser(id);
    
    if (!result.success) {
        return NextResponse.json({ message: `User with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to delete user", error: errorMessage }, { status: 500 });
  }
}
