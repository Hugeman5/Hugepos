
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as inventoryRepo from '@/lib/inventoryRepo';
import { recordPayment, getRegister } from '@/lib/registerRepo';
import * as loyaltyRepo from '@/lib/loyaltyRepo';
import * as customersRepo from '@/lib/customersRepo';
import * as giftCardsRepo from '@/lib/giftCardsRepo';
import * as settingsRepo from '@/lib/settingsRepo';
import { cashRound } from '@/lib/money';

export const dynamic = "force-dynamic";

const paymentSchema = z.object({
  type: z.enum(['cash', 'card', 'gift_card', 'eft', 'other']),
  amount: z.number().positive(),
  tendered: z.number().optional(), // For cash
  last4: z.string().optional(), // For card
  ref: z.string().optional(), // For gift_card code
});

const paySchema = z.object({
  payments: z.array(paymentSchema),
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
    const registerState = await getRegister();
    if(registerState.state !== 'OPEN') {
        return NextResponse.json({ message: 'Register is not open. Cannot process payments.'}, { status: 403 });
    }
    const currentShiftId = registerState.currentShift?.id;
    if (!currentShiftId) {
       return NextResponse.json({ message: 'No active shift found.'}, { status: 403 });
    }

    const orderId = params.id;
    const body = await req.json();
    const validation = paySchema.safeParse(body);
    const settings = await settingsRepo.getSettings();

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
            const maxDiscount = (order.totals.subtotal || 0) * (rules.maxRedeemPct / 100);
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

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotalDue = order.totals.total || 0;
    if (totalPaid < orderTotalDue) {
      return NextResponse.json({ message: `Total payment amount ${totalPaid} is less than order total ${orderTotalDue}.` }, { status: 400 });
    }

    for (const payment of payments) {
        let paymentAmount = payment.amount;
        let paymentRecord: any = {};

        if (payment.type === 'gift_card') {
            if (!payment.ref) throw new Error("Gift card code (ref) is required for gift_card payment.");
            await giftCardsRepo.redeem({ code: payment.ref, amount: payment.amount, orderId, user });
        }
        
        if (payment.type === 'cash' && settings.rounding.cashRounding) {
            paymentRecord.amountRounded = cashRound(payment.amount, settings.rounding.cashStep);
            paymentRecord.cashStep = settings.rounding.cashStep;
            paymentAmount = paymentRecord.amountRounded;
        }

        await paymentsRepo.appendPayment({
            orderId,
            type: payment.type,
            amount: payment.amount,
            change: payment.type === 'cash' ? (payment.tendered || paymentAmount) - paymentAmount : 0,
            last4: payment.last4,
            ref: payment.ref,
            user,
            ...paymentRecord
        });
        
        const methodMap: Record<string, 'CASH'|'CARD'|'OTHER'> = {
            cash: 'CASH',
            card: 'CARD',
            eft: 'OTHER',
            other: 'OTHER',
            gift_card: 'OTHER',
        };
        await recordPayment(order.id, methodMap[payment.type], payment.amount);
    }

    order.status = 'PAID';
    order.shiftId = currentShiftId;
    
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
    
    const inventoryMovesCount = await inventoryRepo.applyUsageFromOrder(order);

    return NextResponse.json({ ok: true, orderId, inventoryMovesCount });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`[Pay API] Error processing payment for order ${params.id}:`, error);
    return NextResponse.json({ message: "Failed to process payment", error: errorMessage }, { status: 500 });
  }
}
