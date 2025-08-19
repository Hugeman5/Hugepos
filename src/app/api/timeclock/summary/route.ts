import { NextResponse } from "next/server";
import { earningsForRange } from "@/lib/repos/timeclockRepo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const s = getSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error:"Forbidden" }, { status:403 });

  const data = await earningsForRange({ userId, from, to });
  return NextResponse.json(data);
}
