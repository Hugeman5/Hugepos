
import { NextResponse, type NextRequest } from "next/server";
import { getStatus } from "@/lib/repos/timeclockRepo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const status = await getStatus(userId);
  return NextResponse.json(status);
}
