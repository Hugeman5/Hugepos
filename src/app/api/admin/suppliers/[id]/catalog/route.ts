
import { NextResponse } from 'next/server';
import { SupplierCatalog } from '@/lib/repos/supplierCatalogRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const catalog = await SupplierCatalog.getCatalog(params.id);
    return NextResponse.json(catalog);
}
