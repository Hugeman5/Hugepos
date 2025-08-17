
import { NextResponse } from 'next/server';
import { getPromotions, savePromotions } from '@/lib/promotionsRepo';
import { type PromotionRule } from '@/lib/data';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const promotions = await getPromotions();
    return NextResponse.json(promotions);
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newRule: Partial<PromotionRule> = body;

    const promotions = await getPromotions();
    const newId = `promo_${Date.now()}`;
    const ruleWithId: PromotionRule = { ...(newRule as PromotionRule), id: newId };
    
    promotions.push(ruleWithId);
    await savePromotions(promotions);

    return NextResponse.json(ruleWithId, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
