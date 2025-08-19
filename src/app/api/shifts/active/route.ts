
import { NextResponse } from "next/server";
import { statusFor } from "@/lib/repos/timeclockRepo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const status = await statusFor(userId);
  return NextResponse.json(status);
}
