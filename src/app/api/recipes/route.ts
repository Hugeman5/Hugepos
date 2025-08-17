import { NextResponse } from "next/server";
import { readRecipes, upsertRecipe } from "@/lib/repos/recipesRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = await readRecipes();
  return NextResponse.json(file);
}

export async function POST(req:Request){
  try {
    const body = await req.json();
    // expect a full Recipe object (id, name, bom, yieldPortions, overheadPct, packagingCost, targetGpPct)
    await upsertRecipe(body);
    return NextResponse.json({ ok:true });
  } catch(e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}
