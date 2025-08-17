
import { NextResponse } from 'next/server';
import { SupplierItems } from '@/lib/repos/supplierItemsRepo';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get('supplierId');
  if (!supplierId) {
    return NextResponse.json({ message: 'supplierId is required' }, { status: 400 });
  }
  const items = await SupplierItems.forSupplier(supplierId);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
    const item = await req.json();
    // Basic validation
    if (!item.id || !item.supplierId || !item.name) {
        return NextResponse.json({ message: 'id, supplierId, and name are required' }, { status: 400 });
    }
    const updated = await SupplierItems.upsert(item);
    return NextResponse.json(updated);
}
