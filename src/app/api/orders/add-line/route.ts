

import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menuRepo";
import { computeLine } from "@/lib/orders/computeLine";
import { addLineToOrder } from "@/lib/orders/orderRepo"; // local JSON order storage

export const dynamic = "force-dynamic";

function newId(prefix="l_") { return prefix + Math.random().toString(36).slice(2,10); }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, tableId, itemId, qty = 1, choices = {} } = body || {};

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const menu = await getMenu();
    const computed = computeLine({ menu, itemId, qty: Number(qty || 1), choices });

    const line = {
        ...computed,
        id: newId('cart_'),
        lineId: newId('line_'),
        choices,
        station: "kitchen",
        state: "queued" as const,
    };

    const order = await addLineToOrder({ orderId, tableId, line });
    return NextResponse.json({ ok: true, order, line });
  } catch (e: any) {
    console.error("[add-line] error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to add line item" },
      { status: 400 }
    );
  }
}
