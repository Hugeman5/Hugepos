
import { NextResponse } from 'next/server';
import { getLedger } from '@/lib/loyaltyRepo';
import { type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: customerId } = params;
    if (!customerId) {
        return NextResponse.json({ message: 'Customer ID is required' }, { status: 400 });
    }
    
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10);

    const items = await getLedger(customerId, limit);
    return NextResponse.json({ items });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch ledger", error: errorMessage }, { status: 500 });
  }
}
