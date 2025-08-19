
import { NextResponse } from 'next/server';
import { Suppliers } from '@/lib/repos/suppliersRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const supplier = await Suppliers.byId(params.id);
    if (!supplier) {
        return NextResponse.json({ message: "Supplier not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = await req.json();
    const updated = await Suppliers.upsert({ ...body, id: params.id });
    return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await Suppliers.remove(params.id);
    return NextResponse.json({ success: true });
}
