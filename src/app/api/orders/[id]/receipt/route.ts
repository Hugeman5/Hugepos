import { NextResponse } from 'next/server';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import { buildReceiptHTML } from '@/lib/receipt';

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const [order, payments] = await Promise.all([
      ordersRepo.getOrder(id),
      paymentsRepo.listByOrder(id)
    ]);

    if (!order) {
      return NextResponse.json({ message: `Order ${id} not found` }, { status: 404 });
    }

    const html = buildReceiptHTML(order, payments);
    
    return NextResponse.json({ html });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch receipt", error: errorMessage }, { status: 500 });
  }
}
