
import { NextResponse } from "next/server";
import { Suppliers } from "@/lib/repos/suppliersRepo";
import { SupplierItems } from "@/lib/repos/supplierItemsRepo";
import { POs, type PurchaseOrder } from "@/lib/repos/purchaseOrdersRepo";
import { toPOLines, totals } from "@/lib/purchasing";
export const dynamic = "force-dynamic";

export async function GET(){ return NextResponse.json(await POs.all()); }

export async function POST(req: Request){
  const { supplierId, qtyById, notes } = await req.json();
  const supplier = await Suppliers.byId(supplierId);
  if(!supplier) return NextResponse.json({ error:"Supplier not found" }, { status: 404 });
  const items = await SupplierItems.forSupplier(supplierId);
  const lines = await toPOLines(items, qtyById || {});
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
