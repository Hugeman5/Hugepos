import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
export const dynamic="force-dynamic";

export async function GET(){
  try{
    const p=path.join(process.cwd(),'data','orders.json');
    const rows = JSON.parse(await fs.readFile(p,'utf8').catch(()=> '[]'));
    const now=new Date(); 
    now.setHours(0, 0, 0, 0); // Set to start of today
    const start=now.getTime();
    
    const todays = rows.filter((o:any)=> o.status==="PAID" && new Date(o.ts).getTime()>=start);
    const total = todays.reduce((s:any,o:any)=>s+(o?.totals?.total||0),0);
    const orders = todays.length;
    const avg = orders? total/orders : 0;
    return NextResponse.json({ total, orders, avg });
  }catch(e) {
    console.error("Failed to get sales metrics", e);
    return NextResponse.json({ total:0, orders:0, avg:0 }); 
  }
}
