
import { NextResponse } from "next/server";
import { readAll, type Order } from "@/lib/orders/orderRepo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const allOrders = await readAll();
    const sentOrders = allOrders.filter(o => o.status === "sent");

    // This correctly transforms sent orders into KDS tickets
    const tickets = sentOrders.map(o => ({
      orderId: o.id,
      ticketNo: o.ticketNo,
      tableId: o.tableId,
      createdAt: new Date(o.createdAt).toISOString(),
      lines: o.lines
        .filter(l => l.state !== "bumped")
        .map(l => ({ 
            lineId: l.id, // Use the cart line ID for bumping
            name: l.name, 
            qty: l.qty, 
            state: l.state,
            station: l.station 
        }))
    })).filter(t => t.lines.length > 0);

    return NextResponse.json({ tickets });
  } catch (e:any) {
    console.error("[kds]", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
