import { NextResponse } from "next/server";
import { getMoves } from "@/lib/inventoryRepo";
import { type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const moves = await getMoves();
    const limitedMoves = moves.slice(0, limit);

    return NextResponse.json(limitedMoves);
  } catch (error) {
    console.error("Failed to get inventory moves:", error);
    return NextResponse.json({ message: "Failed to get inventory moves" }, { status: 500 });
  }
}
