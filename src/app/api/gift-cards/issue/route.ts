
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as giftCardsRepo from '@/lib/giftCardsRepo';

export const dynamic = "force-dynamic";

const issueSchema = z.object({
    amount: z.number().positive(),
    code: z.string().optional(),
    customerId: z.string().optional(),
    orderId: z.string().optional(),
    notes: z.string().optional(),
    user: z.object({
        uid: z.string(),
        name: z.string()
    }).optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = issueSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const card = await giftCardsRepo.issue(validation.data);
        return NextResponse.json({ card });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to issue gift card", error: errorMessage }, { status: 500 });
    }
}
