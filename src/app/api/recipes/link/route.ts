import { NextResponse } from "next/server";
import { linkRecipe } from "@/lib/repos/recipesRepo";

export const dynamic = "force-dynamic";

export async function POST(req:Request){
  try {
    const { recipeId, itemId } = await req.json();
    if(!recipeId || !itemId) return NextResponse.json({error:"recipeId and itemId required"}, {status:400});
    await linkRecipe(recipeId, itemId);
    return NextResponse.json({ ok:true });
  } catch(e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}
