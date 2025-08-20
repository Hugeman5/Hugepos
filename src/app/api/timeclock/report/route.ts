
import { NextResponse, type NextRequest } from "next/server";
import { getReport } from "@/lib/repos/timeclockRepo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const report = await getReport(from, to);
  return NextResponse.json(report);
}
