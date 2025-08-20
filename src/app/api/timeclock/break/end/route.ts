
import { NextResponse } from "next/server";
import { endBreak } from "@/lib/repos/timeclockRepo";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    await endBreak(String(userId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e.message.includes("not on break") ? 409 : 400;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
}
