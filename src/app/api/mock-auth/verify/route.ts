import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/usersRepo";
const norm = (v:any)=>String(v??"").trim().toLowerCase();

export async function POST(req: Request) {
  const { identifier, id, name, pin } = await req.json();
  const ident = norm(identifier ?? id ?? name);
  const users = await getAllUsers();
  const u = users.find(x => (x.active !== false) && (norm(x.id)===ident || norm(x.name)===ident));
  if (!u) return NextResponse.json({ error:"User not found" }, { status:404 });
  const ok = String(u.pin ?? "")===String(pin ?? "") || String(u.pinHash ?? "")===String(pin ?? "");
  if (!ok) return NextResponse.json({ error:"Invalid PIN" }, { status:401 });
  return NextResponse.json({ uid:String(u.id), name:String(u.name), role:u.role });
}