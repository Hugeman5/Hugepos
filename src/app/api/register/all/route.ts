
import { NextResponse } from 'next/server';
import { getAllRegisters, saveAllRegisters } from '@/lib/registersRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const registers = await getAllRegisters();
    return NextResponse.json(registers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch registers", error: errorMessage }, { status: 500 });
  }
}

const registerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
const saveSchema = z.array(registerSchema);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = saveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }

    await saveAllRegisters(validation.data);
    return NextResponse.json({ success: true, count: validation.data.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save registers", error: errorMessage }, { status: 500 });
  }
}
