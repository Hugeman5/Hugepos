
import { NextResponse } from 'next/server';
import { Accounts } from '@/lib/repos/accountsRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(await Accounts.all());
}
export async function POST(req: Request) {
    // This is a stub for future functionality
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
