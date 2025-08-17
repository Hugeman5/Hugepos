
import { NextResponse } from "next/server";
import { Suppliers, type Supplier } from "@/lib/repos/suppliersRepo";
export const dynamic = "force-dynamic";

export async function GET(){ return NextResponse.json(await Suppliers.all()); }
export async function POST(req: Request){
  const s = await req.json() as Supplier;
  if(!s.id) s.id = s.name ? (s.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")) : crypto.randomUUID();
  const saved = await Suppliers.upsert(s);
  return NextResponse.json(saved);
}
