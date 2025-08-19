
import { NextResponse } from 'next/server';
import { Taxes } from '@/lib/repos/taxesRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(await Taxes.all());
}
export async function POST(req: Request) {
    // This is a stub for future functionality
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
