
import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menuRepo";
import { computeLine } from "@/lib/orders/computeLine";
import { addLineToOrder } from "@/lib/orders/orderRepo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, tableId, itemId, qty = 1, choices = {} } = body || {};

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    // Load FULL menu (items + modifierSets + taxCodes + currency + defaultTaxRate)
    const menuData = await getMenu();
    const menu = {
        items: menuData.items,
        modifierSets: Object.fromEntries(menuData.modifierSets.map(ms => [ms.id, ms])),
        taxCodes: Object.fromEntries(menuData.taxCodes.map(tc => [tc.code, tc])),
        currency: "ZAR",
        defaultTaxRate: 0.15
    };


    // Compute line w/ safe defaults
    const line = computeLine({ menu, itemId, qty: Number(qty || 1), choices });

    // Persist (create order if not exists)
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
