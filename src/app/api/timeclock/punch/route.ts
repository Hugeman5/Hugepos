import { NextResponse } from "next/server";
import { addPunch } from "@/lib/repos/timeclockRepo";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const s = getSession();
  if (!s) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const body = await req.json().catch(()=> ({}));
  const type = String(body.type||"").trim();
  if (!["in","out","breakStart","breakEnd"].includes(type))
    return NextResponse.json({ error:"Invalid type" }, { status:400 });
  const { id, ts } = await addPunch({
    userId: s.id,
    type: type as any,
    station: body.station,
    note: body.note
  });
  return NextResponse.json({ id, ts, ok:true });
}
