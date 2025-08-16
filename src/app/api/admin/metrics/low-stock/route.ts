import { NextResponse } from 'next/server';
import { getSummary } from '@/lib/inventoryRepo';
export const dynamic="force-dynamic";

export async function GET(){
  try{
    const list = await getSummary();
    const items = list.filter((i:any)=> i.status === 'low' || i.status === 'out');
    return NextResponse.json({ count: items.length, items });
  }catch(e){ 
    console.error("Failed to get low stock metric", e);
    return NextResponse.json({ count:0, items:[] }); 
  }
}
