
import { NextResponse } from 'next/server';
import { getCheck } from '@/lib/serviceRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const check = await getCheck(id);
    if (!check) {
      return NextResponse.json({ message: "Check not found" }, { status: 404 });
    }
    return NextResponse.json(check);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to get check", error: errorMessage }, { status: 500 });
  }
}
