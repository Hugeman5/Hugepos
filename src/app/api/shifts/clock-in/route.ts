
import { NextResponse } from "next/server";
import { clockIn } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  const { userId, ts } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const s = await clockIn(String(userId), Number(ts) || Date.now());
  return NextResponse.json({ ok: true, shift: s });
}
