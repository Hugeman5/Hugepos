
import { NextResponse } from 'next/server';
import { readAll, writeAll } from '@/lib/orders/orderRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string(),
  lineId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }
    
    const { orderId, lineId } = validation.data;
    const orders = await readAll();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const line = order.lines.find(l => l.id === lineId);
    if (!line) {
        return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }

    line.state = "bumped";
    await writeAll(orders);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[kds/bump] error:", e);
    return NextResponse.json({ error: "Failed to bump line item" }, { status: 500 });
  }
}
