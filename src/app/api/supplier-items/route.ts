
import { NextResponse } from "next/server";
import { SupplierItems, type SupplierItem } from "@/lib/repos/supplierItemsRepo";
export const dynamic = "force-dynamic";

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId") || "";
  const rows = supplierId ? await SupplierItems.forSupplier(supplierId) : [];
  return NextResponse.json(rows);
}
export async function POST(req: Request){
  const body = await req.json();
  if (Array.isArray(body)) { await SupplierItems.upsertMany(body as SupplierItem[]); return NextResponse.json({ ok:true }); }
  const saved = await SupplierItems.upsert(body as SupplierItem);
  return NextResponse.json(saved);
}
