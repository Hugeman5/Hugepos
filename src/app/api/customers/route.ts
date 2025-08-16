
import { NextResponse } from 'next/server';
import { search, createOrUpdate } from '@/lib/customersRepo';
import { z } from 'zod';
import { type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const items = await search(q || '', limit);
    return NextResponse.json({ items });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to search customers", error: errorMessage }, { status: 500 });
  }
}

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  groupId: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = customerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: "Invalid customer data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const customer = await createOrUpdate(validation.data);
        return NextResponse.json(customer, { status: 201 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to save customer", error: errorMessage }, { status: 500 });
    }
}
