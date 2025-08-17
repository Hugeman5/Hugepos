
import { NextResponse } from 'next/server';
import { addModifierOption } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  priceDeltaCents: z.number().int().default(0),
  sku: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        const newOption = await addModifierOption(params.id, validation.data);
        return NextResponse.json(newOption, { status: 201 });
    } catch (e) {
        return NextResponse.json({ message: "Failed to add option", error: (e as Error).message }, { status: 500 });
    }
}
