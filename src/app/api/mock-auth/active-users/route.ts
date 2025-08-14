import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/usersRepo";

export async function GET() {
  const rows = await getAllUsers();
  const list = rows
    .filter(u => (u.active !== false) && (u.exposeOnPinLogin ?? true))
    .map(u => ({ id:String(u.id), name:String(u.name), role:u.role, active:u.active !== false }));
  return NextResponse.json(list);
}