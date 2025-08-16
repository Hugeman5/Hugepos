
import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/usersRepo';

export const dynamic = "force-dynamic";

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
