
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as inventoryRepo from '@/lib/inventoryRepo';
import * as shiftsRepo from '@/lib/shiftsRepo';

export const dynamic = "force-dynamic";

const paySchema = z.object({
  type: z.enum(['cash', 'card']),
  amount: z.number().positive(),
  tendered: z.number().optional(),
  last4: z.string().optional(),
  user: z.object({
    uid: z.string(),
    name: z.string(),
  }),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json();
    const validation = paySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const order = await ordersRepo.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ message: `Order ${orderId} not found` }, { status: 404 });
    }
    
    if (order.status === 'PAID') {
        return NextResponse.json({ message: `Order ${orderId} is already paid.` }, { status: 400 });
    }

    const { type, amount, tendered, last4, user } = validation.data;

    if (amount < order.totals.total) {
      return NextResponse.json({ message: `Payment amount ${amount} is less than order total ${order.totals.total}.` }, { status: 400 });
    }

    let change = 0;
    if (type === 'cash' && tendered) {
      if (tendered < amount) {
        return NextResponse.json({ message: `Tendered amount ${tendered} is less than payment amount ${amount}.` }, { status: 400 });
      }
      change = tendered - amount;
    }
    
    const payment = await paymentsRepo.appendPayment({
      orderId,
      type,
      amount,
      change,
      last4: last4,
      user
    });

    order.status = 'PAID';
    // Shift ID should have been set when the order was created
    if (!order.shiftId) {
        console.warn(`Order ${orderId} paid without a shiftId.`);
        const openShift = await shiftsRepo.getOpenShift();
        if (openShift) {
            order.shiftId = openShift.id;
        } else {
             return NextResponse.json({ message: `No open shift to associate payment with.` }, { status: 400 });
        }
    }
    
    await ordersRepo.saveOrder(order);
    
    // Update shift totals
    const shift = await shiftsRepo.getShift(order.shiftId);
    if (shift) {
        if (type === 'cash') {
            shift.cashPayments = (shift.cashPayments || 0) + amount;
            shift.cashExpected = (shift.cashExpected || 0) + amount;
        } else {
            shift.cardPayments = (shift.cardPayments || 0) + amount;
        }
        await shiftsRepo.saveShift(shift);
    }
    
    const inventoryMovesCount = await inventoryRepo.applyUsageFromOrder(order);

    return NextResponse.json({ ok: true, orderId, inventoryMovesCount });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`[Pay API] Error processing payment for order ${params.id}:`, error);
    return NextResponse.json({ message: "Failed to process payment", error: errorMessage }, { status: 500 });
  }
}
