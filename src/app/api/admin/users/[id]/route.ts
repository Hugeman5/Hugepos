
import { NextResponse } from 'next/server';
import { getAllUsers, saveAllUsers, deleteUser } from '@/lib/usersRepo';

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const users = await getAllUsers();
  const u = users.find(x => String(x.id) === String(params.id));
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(u);
}


export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = await req.json().catch(() => ({}));
    const users = await getAllUsers();
    const i = users.findIndex(u => String(u.id) === String(params.id));
    if (i === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const next = { ...users[i], ...patch };
    
    // Ensure numeric fields are correctly typed
    if ("hourlyRate" in patch && typeof patch.hourlyRate !== 'number') {
      const rate = Number(patch.hourlyRate);
      if (!Number.isFinite(rate) || rate < 0) {
        return NextResponse.json({ error: "hourlyRate must be a non-negative number" }, { status: 400 });
      }
      next.hourlyRate = rate;
    }

    users[i] = next;
    await saveAllUsers(users);
    return NextResponse.json({ ok: true, user: users[i] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
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
