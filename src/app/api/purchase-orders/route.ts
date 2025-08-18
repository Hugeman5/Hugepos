

import { NextResponse } from "next/server";
import { Suppliers } from "@/lib/repos/suppliersRepo";
import { SupplierItems } from "@/lib/repos/supplierItemsRepo";
import { POs, type PurchaseOrder } from "@/lib/repos/purchaseOrdersRepo";
import { toPOLines, totals } from "@/lib/purchasing";
import { getSettings } from "@/lib/settingsRepo";
export const dynamic = "force-dynamic";

export async function GET(){ return NextResponse.json(await POs.all()); }

export async function POST(req: Request){
  const { supplierId, qtyById, notes } = await req.json();
  const [supplier, settings] = await Promise.all([
    Suppliers.byId(supplierId),
    getSettings()
  ]);

  if(!supplier) return NextResponse.json({ error:"Supplier not found" }, { status: 404 });
  
  const items = await SupplierItems.forSupplier(supplierId);
  const lines = toPOLines(items, qtyById || {}, settings);
  const keep = lines.filter(l => l.qty > 0);
  const t = totals(keep);
  
  const po: PurchaseOrder = {
    id: `PO-${Date.now()}`,
    supplierId,
    supplierName: supplier.name,
    createdAt: new Date().toISOString(),
    status: "draft",
    lines: keep,
    totals: t,
    notes
  };
  await POs.create(po);
  return NextResponse.json(po);
}
