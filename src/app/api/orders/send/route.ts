
import { NextResponse } from "next/server";
import { sendOrder } from "@/lib/orders/orderRepo";
import { nextSeq } from "@/lib/sequence";
import * as stationsRepo from '@/lib/stationsRepo';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=> ({}));
    const { orderId, tableId } = body || {};

    const routeFor = async (line: { productId: string, product: { catId: string } }) => {
        return await stationsRepo.resolveStationForProduct(line.productId, line.product.catId);
    };

    let order = await sendOrder({
      orderId, 
      tableId,
      routeFor,
    });
    
    if (!order.ticketNo) {
        order.ticketNo = await nextSeq("ticket");
        await sendOrder({ orderId: order.id, tableId: order.tableId, routeFor }); // Re-save with ticketNo
    }

    return NextResponse.json({ ok: true, order });
  } catch (e:any) {
    console.error("[orders/send]", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
