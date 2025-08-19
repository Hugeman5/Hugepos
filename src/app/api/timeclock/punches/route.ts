import { NextResponse } from "next/server";
import { listPunches } from "@/lib/repos/timeclockRepo";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/lib/usersRepo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("user") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const s = getSession();
  
  // Public endpoint for own punches, admin can view others
  const userId = s?.role === 'admin' ? userIdParam : s?.id;

  if (!userId) {
      // If no session and no user param for admin, we can't do anything.
      // Or if it's not an admin and there's no session.
      return NextResponse.json([]);
  }

  const rows = await listPunches({ userId, from, to });
  return NextResponse.json(rows);
}
