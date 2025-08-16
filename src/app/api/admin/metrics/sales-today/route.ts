
import { NextResponse } from 'next/server';
import { listRecent } from '@/lib/ordersRepo';

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const allOrders = await listRecent(500); // Fetch a larger number of recent orders to be safe
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaysPaidOrders = allOrders.filter(o => 
        o.status === "PAID" && 
        new Date(o.ts).getTime() >= todayStart
    );
    
    const total = todaysPaidOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
    const orders = todaysPaidOrders.length;
    const avg = orders > 0 ? total / orders : 0;
    
    return NextResponse.json({ total, orders, avg });
  } catch(e) {
    console.error("[API] /api/admin/metrics/sales-today Error:", e);
    return NextResponse.json({ message: "Failed to get sales metrics", error: (e as Error).message }, { status: 500 });
  }
}
