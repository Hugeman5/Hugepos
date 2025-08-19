import { NextResponse } from "next/server";
import { summary } from "@/lib/repos/timeclockRepo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const s = getSession();
  if (!s) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  if (s.role !== "admin") return NextResponse.json({ error:"Forbidden" }, { status:403 });

  const data = await summary({ userId, from, to });
  return NextResponse.json(data);
}
