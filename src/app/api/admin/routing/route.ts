
import { NextResponse } from 'next/server';
import { getRouting, saveRouting } from '@/lib/stationsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const routing = await getRouting();
    return NextResponse.json(routing);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch routing rules", error: errorMessage }, { status: 500 });
  }
}

const saveRoutingSchema = z.object({
  defaultStation: z.string().min(1),
  byProduct: z.record(z.string()),
  byCategory: z.record(z.string()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = saveRoutingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    await saveRouting(validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save routing rules", error: errorMessage }, { status: 500 });
  }
}
