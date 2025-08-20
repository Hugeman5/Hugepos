
import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menuRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menu = await getMenu();
    return NextResponse.json(menu);
  } catch (e:any) {
    console.error("[admin/menu]", e);
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 });
  }
}
