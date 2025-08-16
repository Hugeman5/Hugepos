import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/usersRepo";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getAllUsers();
    const list = rows
      .filter(u => (u?.active ?? true) && (u?.exposeOnPinLogin ?? true))
      .map(u => ({ id: String(u.id), name: String(u.name), role: u.role, active: u?.active !== false }));
    return NextResponse.json(list, { status: 200 });
  } catch (e) {
    console.error("[mock-auth/active-users] failed:", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
