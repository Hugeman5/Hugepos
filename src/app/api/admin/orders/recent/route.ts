import { NextResponse } from 'next/server';
import { listRecent } from '@/lib/ordersRepo';
export const dynamic="force-dynamic";

export async function GET(){
  try{
    const items = await listRecent(10);
    return NextResponse.json({ items });
  }catch(e){ 
    console.error("Failed to get recent orders", e);
    return NextResponse.json({ items:[] }); 
  }
}
