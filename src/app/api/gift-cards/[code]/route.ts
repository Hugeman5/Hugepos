
import { NextResponse } from 'next/server';
import * as giftCardsRepo from '@/lib/giftCardsRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { code: string } }) {
    try {
        const card = await giftCardsRepo.getCard(params.code);
        if (!card) {
            return NextResponse.json({ message: "Gift card not found" }, { status: 404 });
        }
        return NextResponse.json({ card });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to fetch gift card", error: errorMessage }, { status: 500 });
    }
}
