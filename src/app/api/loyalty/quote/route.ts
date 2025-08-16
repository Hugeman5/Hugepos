
import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customersRepo';
import { getRules } from '@/lib/loyaltyRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const quoteSchema = z.object({
  customerId: z.string(),
  subtotal: z.number().min(0),
  pointsToRedeem: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = quoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { customerId, subtotal, pointsToRedeem } = validation.data;

    const [customer, rules] = await Promise.all([
      getCustomer(customerId),
      getRules(),
    ]);

    if (!customer) {
      return NextResponse.json({ ok: false, message: 'Customer not found' }, { status: 404 });
    }

    const maxDiscountValue = subtotal * (rules.maxRedeemPct / 100);
    const maxPointsForDiscount = maxDiscountValue * rules.redeem.pointsPerCurrency;

    const usablePoints = Math.min(pointsToRedeem, customer.points ?? 0, maxPointsForDiscount);
    const cappedByPct = pointsToRedeem > maxPointsForDiscount;
    const value = usablePoints / rules.redeem.pointsPerCurrency;
    
    return NextResponse.json({
      ok: true,
      pointsToRedeem: usablePoints,
      value: parseFloat(value.toFixed(2)),
      cappedByPct,
      maxUsablePoints: Math.floor(maxPointsForDiscount),
      customerPoints: customer.points ?? 0
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ ok: false, message: "Failed to get quote", error: errorMessage }, { status: 500 });
  }
}
