
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as serviceRepo from '@/lib/serviceRepo';
import * as ordersRepo from '@/lib/ordersRepo';

export const dynamic = "force-dynamic";

const mergeSchema = z.object({
  fromCheckId: z.string(),
  toCheckId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = mergeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { fromCheckId, toCheckId } = validation.data;
    if (fromCheckId === toCheckId) {
        return NextResponse.json({ message: "Cannot merge a check with itself." }, { status: 400 });
    }

    const fromCheck = await serviceRepo.getCheck(fromCheckId);
    const toCheck = await serviceRepo.getCheck(toCheckId);

    if (!fromCheck || !toCheck) {
        return NextResponse.json({ message: "One or both checks not found." }, { status: 404 });
    }

    const fromOrder = await ordersRepo.getOrder(fromCheck.orderId);
    const toOrder = await ordersRepo.getOrder(toCheck.orderId);

    if (!fromOrder || !toOrder) {
        return NextResponse.json({ message: "One or both orders not found." }, { status: 404 });
    }
    
    // Move all lines from the 'from' order to the 'to' order
    toOrder.lines.push(...fromOrder.lines);
    fromOrder.lines = [];

    // Recalculate totals for both
    await ordersRepo.recalculateTotals(toOrder.id);
    await ordersRepo.recalculateTotals(fromOrder.id);
    
    // Close the now-empty 'from' check
    await serviceRepo.closeCheck(fromCheckId);
    
    // Update the 'to' check guest count
    toCheck.guests += fromCheck.guests;
    await serviceRepo.saveCheck(toCheck);

    return NextResponse.json({ success: true, updatedCheckId: toCheck.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to merge checks", error: errorMessage }, { status: 500 });
  }
}
