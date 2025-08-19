
import { NextResponse } from 'next/server';
import { sendOrder } from '@/lib/orders/orderRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().optional(),
  tableId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }
    
    const { orderId, tableId } = validation.data;
    if (!orderId && !tableId) {
        return NextResponse.json({ error: "orderId or tableId is required" }, { status: 400 });
    }

    const order = await sendOrder({ 
        orderId, 
        tableId, 
        routeFor: () => "kitchen" // Basic routing for now
    });

    return NextResponse.json({ ok: true, order });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
