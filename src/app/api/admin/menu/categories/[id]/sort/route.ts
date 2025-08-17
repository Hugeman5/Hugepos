
import { NextResponse } from 'next/server';
import { sortItems } from '@/lib/menuRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const schema = z.object({
  order: z.array(z.string()),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
        }
        await sortItems(params.id, validation.data.order);
        return NextResponse.json({ success: true });
    } catch(e) {
        return NextResponse.json({ message: "Failed to sort items", error: (e as Error).message }, { status: 500 });
    }
}

    