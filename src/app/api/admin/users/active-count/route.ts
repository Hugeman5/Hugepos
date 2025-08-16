import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/usersRepo';
export const dynamic="force-dynamic";

export async function GET(){
  try { 
    const u = await getAllUsers(); 
    return NextResponse.json({ count: u.filter((x:any)=>x.active!==false).length }); 
  } catch(e) { 
    console.error("Failed to get active user count", e);
    return NextResponse.json({ count:0 }); 
  }
}
