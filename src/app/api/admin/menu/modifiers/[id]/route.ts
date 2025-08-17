
import { NextResponse } from 'next/server';
import { updateModifierSet, deleteModifierSet } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['single', 'multi']).optional(),
  required: z.boolean().optional(),
  min: z.number().int().min(0).optional(),
  max: z.number().int().min(1).optional(),
  sort: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const updated = await updateModifierSet(params.id, validation.data);
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ message: "Failed to update modifier set", error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await deleteModifierSet(params.id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ message: "Failed to delete modifier set", error: (e as Error).message }, { status: 500 });
    }
}
