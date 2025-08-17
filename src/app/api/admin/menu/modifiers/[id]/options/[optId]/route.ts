
import { NextResponse } from 'next/server';
import { updateModifierOption, removeModifierOption } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).optional(),
  priceDeltaCents: z.number().int().optional(),
  sku: z.string().optional(),
  sort: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string, optId: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const updated = await updateModifierOption(params.id, params.optId, validation.data);
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ message: "Failed to update option", error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string, optId: string } }) {
    try {
        await removeModifierOption(params.id, params.optId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ message: "Failed to delete option", error: (e as Error).message }, { status: 500 });
    }
}
