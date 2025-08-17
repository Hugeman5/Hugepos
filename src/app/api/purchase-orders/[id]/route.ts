
import { NextResponse } from 'next/server';
import { POs } from '@/lib/repos/purchaseOrdersRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const po = await POs.byId(params.id);
  if (!po) {
    return NextResponse.json({ message: 'PO not found' }, { status: 404 });
  }
  return NextResponse.json(po);
}
