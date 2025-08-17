
import { NextResponse } from 'next/server';
import { upsertItem } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  catId: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().min(0),
  taxCode: z.string().optional(),
  sku: z.string().optional(),
  active: z.boolean().optional(),
  modifierSetIds: z.array(z.string()).optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const newItem = await upsertItem(validation.data);
        return NextResponse.json(newItem, { status: 201 });
    } catch(e) {
        return NextResponse.json({ message: "Failed to create item", error: (e as Error).message }, { status: 500 });
    }
}

    
