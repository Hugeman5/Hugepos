
import { NextResponse } from 'next/server';
import { getPromotions, savePromotions } from '@/lib/promotionsRepo';
import { type PromotionRule } from '@/lib/data';

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const patch = await req.json();
    const promotions = await getPromotions();
    const index = promotions.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ message: "Promotion not found" }, { status: 404 });
    }

    promotions[index] = { ...promotions[index], ...patch };
    await savePromotions(promotions);
    return NextResponse.json(promotions[index]);

  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    let promotions = await getPromotions();
    const initialLength = promotions.length;
    promotions = promotions.filter(p => p.id !== id);

    if (promotions.length === initialLength) {
      return NextResponse.json({ message: "Promotion not found" }, { status: 404 });
    }

    await savePromotions(promotions);
    return NextResponse.json({ success: true });
    
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
