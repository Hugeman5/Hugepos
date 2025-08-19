
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateLineQty } from '@/lib/orders/orderRepo';
import { getMenu } from '@/lib/menuRepo';
import { computeLine } from '@/lib/orders/computeLine';

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  orderId: z.string(),
  lineId: z.string(),
  qty: z.number().min(0),
});

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const validation = patchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { orderId, lineId, qty } = validation.data;
        const menu = await getMenu();

        const recompute = (oldLine: any) => {
            const fresh = computeLine({ menu, itemId: oldLine.itemId, qty, choices: oldLine.choices || {} });
            return { ...oldLine, ...fresh };
        };

        const updatedOrder = await updateLineQty({ orderId, lineId, qty, recompute });
        
        return NextResponse.json({ ok:true, order: updatedOrder });

    } catch (e) {
        console.error("[API line PATCH] Error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
