
import { NextResponse } from 'next/server';
import { listRecent } from '@/lib/ordersRepo';

export const dynamic="force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const items = await listRecent(limit);
    return NextResponse.json({ items });
  } catch(e) {
    console.error(`[API] /api/admin/orders/recent Error:`, e);
    return NextResponse.json({ message: "Failed to get recent orders", error: (e as Error).message }, { status: 500 });
  }
}
