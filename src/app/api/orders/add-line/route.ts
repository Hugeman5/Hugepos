
import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menuRepo";                // must return { items, modifierSets, taxCodes, currency, defaultTaxRate }
import { computeLine } from "@/lib/orders/computeLine";
import { addLineToOrder } from "@/lib/orders/orderRepo"; // local JSON order storage

export const dynamic = "force-dynamic";

function newLineId() { return "l_" + Math.random().toString(36).slice(2,10); }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, tableId, itemId, qty = 1, choices = {} } = body || {};

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    // Load FULL menu (items + modifierSets + taxCodes + currency + defaultTaxRate)
    const menu = await getMenu();

    // Compute line w/ safe defaults
    const computed = computeLine({ menu, itemId, qty: Number(qty || 1), choices });

    const line = {
        ...computed,
        id: newLineId(),
        choices,
        station: "kitchen",
        state: "queued" as const,
    };


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
