
import { NextResponse } from 'next/server';
import { listRecent } from '@/lib/ordersRepo';

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const orders = await listRecent(200); // Check more orders
    const paidOrders = orders.filter(o => o.status === 'PAID');
    
    let openLines = 0;
    for (const order of paidOrders) {
        for (const line of order.lines) {
            // A line is considered open if it's not done and not part of a completed order
            if (line.prep.status !== 'done' && order.status !== 'COMPLETED') {
                openLines++;
            }
        }
    }

    return NextResponse.json({ count: openLines });
  } catch(e) { 
    console.error(`[API] /api/admin/metrics/open-tickets Error:`, e);
    return NextResponse.json({ message: "Failed to get open tickets metric", error: (e as Error).message }, { status: 500 });
  }
}
