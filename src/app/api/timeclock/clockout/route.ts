
import { NextResponse } from "next/server";
import { clockOut } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const totals = await clockOut(String(userId));
    return NextResponse.json({ ok: true, totals });
  } catch (e: any) {
    const status = e.message.includes("not clocked in") ? 409 : 400;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
}
