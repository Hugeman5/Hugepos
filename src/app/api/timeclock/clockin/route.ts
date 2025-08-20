
import { NextResponse } from "next/server";
import { clockIn } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  try {
    const { userId, stationId, role, hourlyRate } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const shift = await clockIn({ userId, stationId, role, hourlyRate });
    return NextResponse.json({ ok: true, shiftId: shift.shiftId });
  } catch (e: any) {
    const status = e.message.includes("already clocked in") ? 409 : 400;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
}
