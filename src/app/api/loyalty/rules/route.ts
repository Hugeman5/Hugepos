
import { NextResponse } from 'next/server';
import { getRules, saveRules } from '@/lib/loyaltyRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await getRules();
    return NextResponse.json(rules);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch loyalty rules", error: errorMessage }, { status: 500 });
  }
}

const rulesSchema = z.object({
    earn: z.object({ pointsPerCurrency: z.number() }),
    redeem: z.object({ pointsPerCurrency: z.number() }),
    maxRedeemPct: z.number().min(0).max(100),
    autoEnroll: z.boolean(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = rulesSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        await saveRules(validation.data);
        return NextResponse.json({ success: true });
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to save loyalty rules", error: errorMessage }, { status: 500 });
    }
}
