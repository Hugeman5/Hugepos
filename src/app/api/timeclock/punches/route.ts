import { NextResponse } from "next/server";
import { listPunches } from "@/lib/repos/timeclockRepo";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/lib/usersRepo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const s = getSession();
  if (!s) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  // Non-admin can only view their own punches
  const isAdmin = s.role === "admin";
  const safeUser = isAdmin ? userId : s.uid;

  const rows = await listPunches({ userId: safeUser, from, to });
  return NextResponse.json(rows);
}
