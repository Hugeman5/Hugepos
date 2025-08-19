
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as menuRepo from '@/lib/menuRepo';
import * as pricing from '@/lib/pricing';
import * as stationsRepo from '@/lib/stationsRepo';
import { type CartLineMod } from '@/lib/data';

export const dynamic = "force-dynamic";

const addLineSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  qty: z.number().min(1),
  mods: z.array(z.object({
      setId: z.string(),
      optionIds: z.array(z.string())
  })).optional(),
});


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = addLineSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const { orderId, productId, qty, mods = [] } = validation.data;
        
        const [order, menu] = await Promise.all([
            ordersRepo.getOrder(orderId),
            menuRepo.getMenu()
        ]);

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        const product = menu.items.find(i => i.id === productId);
        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }
        
        // Validate required modifiers
        if (product.modifierSetIds) {
            for (const setId of product.modifierSetIds) {
                const set = menu.modifierSets.find(ms => ms.id === setId);
                if (set?.required) {
                    const selection = mods.find(m => m.setId === setId);
                    if (!selection || selection.optionIds.length < set.min) {
                        return NextResponse.json({ message: `Missing required modifier from set "${set.name}"` }, { status: 400 });
                    }
                }
            }
        }
        
        // This is a temporary cart line for pricing
        const tempCartLine = { id: 'temp', productId, qty, mods, subtotal: 0, tax: 0, total: 0 };
        const pricedLine = await pricing.computeLine(tempCartLine, product, menu);
        const stationId = await stationsRepo.resolveStationForProduct(product.id, product.catId);

        order.lines.push({
            id: pricedLine.id,
            lineId: `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            productId: product.id,
            name: product.name,
            qty: qty,
            unitPrice: product.priceCents,
            mods: pricedLine.mods,
            lineTotal: pricedLine.total,
            prep: {
                stationId: stationId,
                status: 'queued'
            }
        });
        
        await ordersRepo.recalculateTotals(order.id);
        const updatedOrder = await ordersRepo.getOrder(order.id);

        return NextResponse.json(updatedOrder);

    } catch (e) {
        console.error("[API add-line] Error:", e);
        return NextResponse.json({ message: "Failed to add line item", error: (e as Error).message }, { status: 500 });
    }
}
