
import { NextResponse } from 'next/server';
import { upsertItem, deleteItem } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  catId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  taxCode: z.string().optional(),
  sku: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const updated = await upsertItem({ ...validation.data, id: params.id, name: validation.data.name!, catId: validation.data.catId!, priceCents: validation.data.priceCents! });
        return NextResponse.json(updated);
    } catch(e) {
        return NextResponse.json({ message: "Failed to update item", error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await deleteItem(params.id);
        return NextResponse.json({ success: true });
    } catch(e) {
        return NextResponse.json({ message: "Failed to delete item", error: (e as Error).message }, { status: 500 });
    }
}

    