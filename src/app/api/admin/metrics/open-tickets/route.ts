import { NextResponse } from 'next/server';
import { getStations } from '@/lib/stationsRepo';
import { listRecent } from '@/lib/ordersRepo';
export const dynamic="force-dynamic";

export async function GET(){
  try{
    const orders = await listRecent(200); // Check more orders
    const paidOrders = orders.filter(o => o.status === 'PAID');
    
    let openLines = 0;
    for (const order of paidOrders) {
        for (const line of order.lines) {
            if (line.prep.status !== 'done') {
                openLines++;
            }
        }
    }

    return NextResponse.json({ count: openLines });
  }catch(e) { 
    console.error("Failed to get open tickets metric", e);
    return NextResponse.json({ count:0 }); 
  }
}
