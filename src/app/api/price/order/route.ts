
import { NextResponse } from 'next/server';
import { getProducts, getTaxes, getModifiers } from '@/lib/catalogRepo';
import { computeOrder } from '@/lib/pricing';
import { z } from 'zod';
import { type CartLine } from '@/lib/data';

export const dynamic = 'force-dynamic';

const schema = z.object({
  lines: z.array(z.object({
    productId: z.string(),
    qty: z.number().min(1),
    mods: z.array(z.object({
        id: z.string(),
        optionId: z.string().optional(),
        count: z.number().optional(),
    })).optional(),
  })),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lines } = body as { lines: CartLine[] };

        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(validation.error, { status: 400 });
        }

        const [products, taxes, modifiers] = await Promise.all([
            getProducts(),
            getTaxes(),
            getModifiers(),
        ]);
        
        const productMap = new Map(products.map(p => [p.id, p]));
        const taxMap = new Map(taxes.map(t => [t.id, t]));
        const modifierMap = new Map(modifiers.map(m => [m.id, m]));

        const result = computeOrder({ lines }, productMap, modifierMap, taxMap);

        return NextResponse.json(result);

    } catch (e: any) {
        console.error('[/api/price/order]', e);
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
