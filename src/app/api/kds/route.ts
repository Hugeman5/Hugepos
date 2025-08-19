
import { NextResponse } from "next/server";
import { readAll } from "@/lib/orders/orderRepo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const station = url.searchParams.get("station") || "kitchen";
    const orders = await readAll();
    const tickets = orders
      .filter(o => o.status === "sent")
      .map(o => ({
        orderId: o.id,
        ticketNo: o.ticketNo,
        tableId: o.tableId,
        createdAt: o.createdAt,
        lines: o.lines
          .filter(l => (l.station || "kitchen") === station && l.state !== "bumped")
          .map(l => ({ lineId: l.id, name: l.name, qty: l.qty, state: l.state }))
      }))
      .filter(t => t.lines.length > 0);
    return NextResponse.json({ tickets });
  } catch (e:any) {
    console.error("[kds]", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
