
import { NextResponse } from 'next/server';
import { closeCheck } from '@/lib/serviceRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const closeSchema = z.object({
  checkId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = closeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }
    
    const closedCheck = await closeCheck(validation.data.checkId);
    return NextResponse.json(closedCheck);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to close check", error: errorMessage }, { status: 500 });
  }
}
