
import { NextResponse } from 'next/server';
import { Taxes } from '@/lib/repos/taxesRepo';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    // This is a stub for future functionality
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    // This is a stub for future functionality
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
