import { NextResponse } from 'next/server';
import { type Cart } from '@/lib/data';
import * as ordersRepo from '@/lib/ordersRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  user: z.object({
    uid: z.string(),
    name: z.string(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().min(1),
    mods: z.array(z.object({
      id: z.string(),
      optionId: z.string().optional(),
      count: z.number().optional(),
    })).optional(),
  }))
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { user, items } = validation.data;

    // The API expects a Cart object, so we transform the items.
    const cart: Cart = {
      lines: items.map(item => ({
        id: `${item.productId}-${Math.random()}`, // Temporary ID for processing
        productId: item.productId,
        qty: item.qty,
        mods: item.mods || [],
        subtotal: 0,
        tax: 0,
        total: 0,
      }))
    };

    const draftOrder = await ordersRepo.createDraft(user, cart);
    return NextResponse.json(draftOrder);

  } catch (error) {
    console.error("Failed to create order:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to create order", error: errorMessage }, { status: 500 });
  }
}
