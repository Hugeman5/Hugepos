import { NextResponse } from 'next/server';
import * as ordersRepo from '@/lib/ordersRepo';

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const order = await ordersRepo.getOrder(id);

    if (!order) {
      return NextResponse.json({ message: `Order ${id} not found` }, { status: 404 });
    }
    
    return NextResponse.json(order);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch order", error: errorMessage }, { status: 500 });
  }
}
