
import { NextResponse } from "next/server";
import { getAllUsers, saveAllUsers } from "@/lib/usersRepo";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { hourlyRate } = await req.json().catch(() => ({}));
    const rate = Number(hourlyRate);
    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json({ error: "hourlyRate must be >= 0" }, { status: 400 });
    }

    const users = await getAllUsers();
    const i = users.findIndex(u => String(u.id) === String(params.id));
    if (i === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    users[i] = { ...users[i], hourlyRate: rate };
    await saveAllUsers(users);

    return NextResponse.json({ ok: true, id: params.id, hourlyRate: rate });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update rate" }, { status: 500 });
  }
}
