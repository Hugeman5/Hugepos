
import { NextResponse } from 'next/server';
import { createCategory } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const newCategory = await createCategory(validation.data.name, validation.data.color);
        return NextResponse.json(newCategory, { status: 201 });
    } catch(e) {
        return NextResponse.json({ message: "Failed to create category", error: (e as Error).message }, { status: 500 });
    }
}

    