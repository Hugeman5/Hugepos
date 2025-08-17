
import { NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const updated = await updateCategory(params.id, validation.data);
        return NextResponse.json(updated);
    } catch(e) {
        return NextResponse.json({ message: "Failed to update category", error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await deleteCategory(params.id);
        return NextResponse.json({ success: true });
    } catch(e) {
        return NextResponse.json({ message: "Failed to delete category", error: (e as Error).message }, { status: 500 });
    }
}

    