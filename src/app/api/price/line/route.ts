
import { NextResponse } from 'next/server';
import { getProduct, getTax, getModifiersByIds } from '@/lib/catalogRepo';
import { computeLine } from '@/lib/pricing';
import { z } from 'zod';
import { type CartLine } from '@/lib/data';

export const dynamic = 'force-dynamic';

const schema = z.object({
  productId: z.string(),
  qty: z.number().min(1),
  mods: z.array(z.object({
      id: z.string(),
      optionId: z.string().optional(),
      count: z.number().optional(),
  })).optional(),
});


export async function POST(req: Request) {
    try {
        const line = await req.json() as CartLine;

        const validation = schema.safeParse(line);
        if (!validation.success) {
            return NextResponse.json(validation.error, { status: 400 });
        }

        const product = await getProduct(line.productId);
        if (!product) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const tax = await getTax(product.taxId);
         if (!tax) {
            return NextResponse.json({ message: 'Tax info not found' }, { status: 404 });
        }
        
        const allModifiers = product.modifierIds ? await getModifiersByIds(product.modifierIds) : [];
        const result = computeLine(line, product, allModifiers, tax);

        return NextResponse.json(result);

    } catch (e: any) {
        console.error('[/api/price/line]', e);
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
