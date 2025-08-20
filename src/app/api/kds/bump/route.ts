
import { NextResponse } from "next/server";
import { readAll, writeAll, type Order } from "@/lib/orders/orderRepo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId, lineId } = await req.json();
    if (!orderId || !lineId) {
        return NextResponse.json({ error: "orderId and lineId are required" }, { status: 400 });
    }

    const all = await readAll();
    const o = all.find(x => x.id === orderId);
    if (!o) return NextResponse.json({ error:"Order not found" }, { status: 404 });
    
    const l = o.lines.find(x => x.id === lineId || x.lineId === lineId);
    if (!l) return NextResponse.json({ error:"Line not found" }, { status: 404 });
    
    l.state = "bumped";
    o.updatedAt = Date.now();
    await writeAll(all);

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error("[kds/bump]", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
