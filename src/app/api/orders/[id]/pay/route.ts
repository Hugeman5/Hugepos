

import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as inventoryRepo from '@/lib/inventoryRepo';
import * as shiftsRepo from '@/lib/shiftsRepo';
import * as loyaltyRepo from '@/lib/loyaltyRepo';
import * as customersRepo from '@/lib/customersRepo';
import * as giftCardsRepo from '@/lib/giftCardsRepo';

export const dynamic = "force-dynamic";

const paySchema = z.object({
  payments: z.array(z.object({
    type: z.enum(['cash', 'card', 'gift_card']),
    amount: z.number().positive(),
    tendered: z.number().optional(), // For cash
    last4: z.string().optional(), // For card
    ref: z.string().optional(), // For gift_card code
  })),
  user: z.object({
    uid: z.string(),
    name: z.string(),
  }),
  customerId: z.string().optional(),
  pointsToRedeem: z.number().optional(),
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

    let order = await ordersRepo.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ message: `Order ${orderId} not found` }, { status: 404 });
    }
    
    if (order.status === 'PAID') {
        return NextResponse.json({ message: `Order ${orderId} is already paid.` }, { status: 400 });
    }

    const { payments, user, customerId, pointsToRedeem } = validation.data;
    
    // --- Loyalty & Customer Handling ---
    if (customerId) {
        const customer = await customersRepo.getCustomer(customerId);
        if (customer) {
            order.customer = { id: customer.id, name: customer.name, groupId: customer.groupId };
        }
    }

    if (customerId && pointsToRedeem && pointsToRedeem > 0) {
        const rules = await loyaltyRepo.getRules();
        const customer = await customersRepo.getCustomer(customerId);
        if (customer && customer.points && customer.points >= pointsToRedeem) {
            const redeemValue = pointsToRedeem / rules.redeem.pointsPerCurrency;
            const maxDiscount = order.totals.subtotal * (rules.maxRedeemPct / 100);
            const appliedDiscount = Math.min(redeemValue, maxDiscount);

            if (appliedDiscount > 0) {
                order.totals.total = Math.max(0, order.totals.total - appliedDiscount);
                order.totals.discount = (order.totals.discount || 0) + appliedDiscount;
                
                await loyaltyRepo.postRedemption({
                    customerId,
                    orderId,
                    points: -pointsToRedeem,
                    value: appliedDiscount
                });
            }
        }
    }
    // --- End Loyalty ---

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < order.totals.total) {
      return NextResponse.json({ message: `Total payment amount ${totalPaid} is less than order total ${order.totals.total}.` }, { status: 400 });
    }

    // --- Process payments ---
    for (const payment of payments) {
        if (payment.type === 'gift_card') {
            if (!payment.ref) throw new Error("Gift card code (ref) is required for gift_card payment.");
            await giftCardsRepo.redeem({
                code: payment.ref,
                amount: payment.amount,
                orderId,
                user
            });
        }

        await paymentsRepo.appendPayment({
            orderId,
            type: payment.type,
            amount: payment.amount,
            change: payment.type === 'cash' ? (payment.tendered || payment.amount) - payment.amount : 0,
            last4: payment.last4,
            ref: payment.ref,
            user
        });
    }

    order.status = 'PAID';
    if (!order.shiftId) {
        const openShift = await shiftsRepo.getOpenShift();
        if (openShift) {
            order.shiftId = openShift.id;
        } else {
             return NextResponse.json({ message: `No open shift to associate payment with.` }, { status: 400 });
        }
    }
    
    // Accrue points after successful payment
    if (order.customer) {
        const rules = await loyaltyRepo.getRules();
        const pointsEarned = Math.floor(order.totals.total * rules.earn.pointsPerCurrency);
        if (pointsEarned > 0) {
            await loyaltyRepo.postAccrual({
                customerId: order.customer.id,
                orderId: order.id,
                amount: order.totals.total,
                points: pointsEarned
            });
        }
    }
    
    await ordersRepo.saveOrder(order);
    
    const shift = await shiftsRepo.getShift(order.shiftId);
    if (shift) {
        for (const payment of payments) {
            if (payment.type === 'cash') {
                shift.cashPayments = (shift.cashPayments || 0) + payment.amount;
                shift.cashExpected = (shift.cashExpected || 0) + payment.amount;
            } else if (payment.type === 'card') {
                shift.cardPayments = (shift.cardPayments || 0) + payment.amount;
            } else if (payment.type === 'gift_card') {
                shift.giftCardPayments = (shift.giftCardPayments || 0) + payment.amount;
            }
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
