
import { NextResponse } from 'next/server';
import { getSummary } from '@/lib/inventoryRepo';

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const list = await getSummary();
    const items = list.filter((i:any)=> i.status === 'low' || i.status === 'out');
    return NextResponse.json({ count: items.length, items });
  } catch(e) {
    console.error(`[API] /api/admin/metrics/low-stock Error:`, e);
    return NextResponse.json({ message: "Failed to fetch low stock metric", error: (e as Error).message }, { status: 500 });
  }
}
