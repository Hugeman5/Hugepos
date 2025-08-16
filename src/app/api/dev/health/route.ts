
import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/usersRepo";

export const dynamic = "force-dynamic";

export async function GET(){
  try {
    const users = await getAllUsers();
    return NextResponse.json({ ok:true, users: users.length, timestamp: new Date().toISOString() });
  } catch(e) {
    console.error("[dev/health] failed:", e)
    return NextResponse.json({ ok:false, error: (e as Error).message }, { status: 500 });
  }
}
