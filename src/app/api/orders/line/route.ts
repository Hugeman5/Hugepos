
import { NextResponse } from "next/server";
import { updateLineQty, readAll } from "@/lib/orders/orderRepo";
import { computeLine } from "@/lib/orders/computeLine";
import { getMenu } from "@/lib/menuRepo";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const { orderId, lineId, qty } = await req.json();
    if (!orderId || !lineId || typeof qty !== "number") {
      return NextResponse.json({ error: "orderId, lineId, qty required" }, { status: 400 });
    }

    const menu = await getMenu();
    const allOrders = await readAll();
    const currentOrder = allOrders.find(o => o.id === orderId);
    const oldLine = currentOrder?.lines.find(l => l.id === lineId);

    if (!oldLine) {
        throw new Error("Line or Order not found");
    }
    
    const recompute = (old: typeof oldLine) => {
        const fresh = computeLine({ menu, itemId: old.itemId, qty, choices: old.choices || {} });
        return { ...old, ...fresh, qty };
    }
    
    const order = await updateLineQty({
      orderId, lineId, qty,
      recompute
    });

    return NextResponse.json({ ok: true, order });
  } catch (e:any) {
    console.error("[orders/line PATCH]", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
