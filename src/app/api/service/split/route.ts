
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as serviceRepo from '@/lib/serviceRepo';

export const dynamic = "force-dynamic";

const splitSchema = z.object({
  checkId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = splitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { checkId } = validation.data;
    const updatedCheck = await serviceRepo.createSplit(checkId);

    return NextResponse.json(updatedCheck);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to split check", error: errorMessage }, { status: 500 });
  }
}
