
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { POs } from '@/lib/repos/purchaseOrdersRepo';
import { Suppliers } from '@/lib/repos/suppliersRepo';
import { SupplierItems } from '@/lib/repos/supplierItemsRepo';
import { toPOLines, totals } from '@/lib/purchasing';
import { format } from 'date-fns';

const schema = z.object({
  supplierId: z.string(),
  notes: z.string().optional(),
  qtyById: z.record(z.coerce.number().min(0)),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid data', errors: validation.error.errors }, { status: 400 });
  }

  const { supplierId, qtyById, notes } = validation.data;
  const supplier = await Suppliers.byId(supplierId);
  if (!supplier) {
    return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
  }

  const itemIds = Object.keys(qtyById).filter(id => qtyById[id] > 0);
  const supplierItems = (await SupplierItems.forSupplier(supplierId)).filter(i => itemIds.includes(i.id));

  const lines = await toPOLines(supplierItems, qtyById);
  const poTotals = totals(lines);

  const newPO = await POs.create({
    id: `PO-${format(new Date(), 'yyyyMMdd-HHmmss')}`,
    supplierId,
    supplierName: supplier.name,
    createdAt: new Date().toISOString(),
    status: 'draft',
    lines: lines.filter(l => l.qty > 0),
    totals: poTotals,
    notes,
  });

  return NextResponse.json(newPO);
}

export async function GET() {
    const allPOs = await POs.all();
    return NextResponse.json(allPOs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}
