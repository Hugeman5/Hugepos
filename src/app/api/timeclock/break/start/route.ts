
import { NextResponse } from "next/server";
import { startBreak } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    await startBreak(String(userId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e.message.includes("not clocked in") || e.message.includes("already on break") ? 409 : 400;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
}
