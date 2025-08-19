
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  orderId: z.string(),
  lineId: z.string(),
  qty: z.number().min(1).optional(),
});

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const validation = patchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const { orderId, lineId, qty } = validation.data;
        let order = await ordersRepo.getOrder(orderId);
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        const line = order.lines.find(l => l.lineId === lineId);
        if (!line) {
             return NextResponse.json({ message: "Line not found" }, { status: 404 });
        }

        if (qty !== undefined) {
            line.qty = qty;
        }
        
        // Recalculate totals and save the updated order
        const updatedOrder = await ordersRepo.recalculateTotals(order.id);
        
        return NextResponse.json(updatedOrder);

    } catch (e) {
        console.error("[API line PATCH] Error:", e);
        return NextResponse.json({ message: "Failed to update line", error: (e as Error).message }, { status: 500 });
    }
}


const deleteSchema = z.object({
  orderId: z.string(),
  lineId: z.string(),
});

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const validation = deleteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }
        
        const { orderId, lineId } = validation.data;
        let order = await ordersRepo.getOrder(orderId);
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        order.lines = order.lines.filter(l => l.lineId !== lineId);
        
        const updatedOrder = await ordersRepo.recalculateTotals(order.id);

        return NextResponse.json(updatedOrder);

    } catch (e) {
         console.error("[API line DELETE] Error:", e);
        return NextResponse.json({ message: "Failed to remove line", error: (e as Error).message }, { status: 500 });
    }
}
