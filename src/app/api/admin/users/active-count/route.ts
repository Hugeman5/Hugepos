
import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/usersRepo';

export const dynamic="force-dynamic";

export async function GET(){
  try { 
    const u = await getAllUsers(); 
    return NextResponse.json({ count: u.filter((x:any)=>x.active!==false).length }); 
  } catch(e) { 
    console.error(`[API] /api/admin/users/active-count Error:`, e);
    return NextResponse.json({ message: "Failed to get active user count", error: (e as Error).message }, { status: 500 });
  }
}
