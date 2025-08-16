
import { NextResponse } from 'next/server';
import { getCheckByTable } from '@/lib/serviceRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { tableId: string } }) {
  try {
    const { tableId } = params;
    const check = await getCheckByTable(tableId);
    if (!check) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(check);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to get check", error: errorMessage }, { status: 500 });
  }
}
