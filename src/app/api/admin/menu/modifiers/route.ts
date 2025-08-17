
import { NextResponse } from 'next/server';
import { listModifierSets, createModifierSet } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sets = await listModifierSets();
        return NextResponse.json(sets);
    } catch (e) {
        return NextResponse.json({ message: "Failed to list modifier sets", error: (e as Error).message }, { status: 500 });
    }
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['single', 'multi']),
  required: z.boolean(),
  min: z.number().int().min(0),
  max: z.number().int().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const newSet = await createModifierSet(validation.data);
        return NextResponse.json(newSet, { status: 201 });
    } catch (e) {
        return NextResponse.json({ message: "Failed to create modifier set", error: (e as Error).message }, { status: 500 });
    }
}
