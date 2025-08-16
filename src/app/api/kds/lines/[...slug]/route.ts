
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import { type PrepStatus } from '@/lib/data';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['queued', 'in_progress', 'done']),
});

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string[] } }
) {
  try {
    const [orderId, lineId] = params.slug;
    if (!orderId || !lineId) {
      return NextResponse.json({ message: 'Both orderId and lineId are required in the URL.' }, { status: 400 });
    }
    
    const body = await req.json();
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }
    const { status } = validation.data;

    const order = await ordersRepo.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ message: `Order ${orderId} not found.` }, { status: 404 });
    }

    const line = order.lines.find(l => l.lineId === lineId);
    if (!line) {
      return NextResponse.json({ message: `Line ${lineId} not found in order ${orderId}.` }, { status: 404 });
    }

    line.prep.status = status;

    // Optional: Check if all lines are done and update order status
    const allDone = order.lines.every(l => l.prep.status === 'done');
    if (allDone) {
        // You could update order status here, e.g., to 'COMPLETED'
        // For now, we keep it as PAID as per instructions.
    }

    await ordersRepo.saveOrder(order);

    return NextResponse.json({ success: true, lineId, newStatus: status });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API KDS Lines] Error updating line status:`, error);
    return NextResponse.json({ message: 'Failed to update line status', error: errorMessage }, { status: 500 });
  }
}
