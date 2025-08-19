
import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menuRepo";
import { computeLine } from "@/lib/orders/computeLine";
import { addLineToOrder } from "@/lib/orders/orderRepo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // The client sends productId, but the code was looking for itemId.
    // Let's use productId which is sent from cashier/page.tsx
    const { orderId, tableId, productId, qty = 1, mods = [] } = body || {};

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Load FULL menu (items + modifierSets + taxCodes + currency + defaultTaxRate)
    const menuData = await getMenu();
    
    // Map client-side mods to server-side choices format
    const choices = mods.reduce((acc: any, mod: any) => {
        if(mod.setId && mod.optionIds) {
            acc[mod.setId] = mod.optionIds.map((optId: string) => ({ id: optId }));
        }
        return acc;
    }, {});


    // Compute line w/ safe defaults
    const line = computeLine({ menu: menuData, itemId: productId, qty: Number(qty || 1), choices });

    // Persist (create order if not exists)
    const order = await addLineToOrder({ orderId, tableId, line });
    
    return NextResponse.json(order);
    
  } catch (e: any) {
    console.error("[add-line] error:", e);
    return NextResponse.json(
      { message: e?.message || "Failed to add line item" },
      { status: 400 }
    );
  }
}
