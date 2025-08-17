
import { NextResponse } from "next/server";
import { getSummary } from "@/lib/inventoryRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to get inventory summary:", error);
    return NextResponse.json({ message: "Failed to get inventory summary" }, { status: 500 });
  }
}
