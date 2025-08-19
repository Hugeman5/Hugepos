
import { NextResponse } from "next/server";
import { breakStart } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  const { userId, ts } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  try {
    const s = await breakStart(String(userId), Number(ts) || Date.now());
    return NextResponse.json({ ok: true, shift: s });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "breakStart failed" }, { status: 400 });
  }
}
