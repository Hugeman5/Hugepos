import { NextResponse } from "next/server";
import { readRecipes } from "@/lib/repos/recipesRepo";
import { readIngredients } from "@/lib/repos/ingredientsRepo";
import { computeRecipeCost } from "@/lib/costing";

export const dynamic = "force-dynamic";

export async function POST(req:Request){
  try {
    const { recipeId } = await req.json();
    const file = await readRecipes();
    const recipe = file.recipes.find(r=>r.id===recipeId);
    if(!recipe) return NextResponse.json({error:"Not found"}, {status:404});
    const all = await readIngredients();
    const bom = recipe.bom.map(row => ({
      ingredient: all.find(i=>i.id===row.ingredientId),
      qty: row.qty, uom: row.uom, wastePct: row.wastePct ?? 0
    }));
    const result = await computeRecipeCost({
      bom, packagingCost: recipe.packagingCost,
      overheadPct: recipe.overheadPct,
      yieldPortions: recipe.yieldPortions,
      targetGpPct: recipe.targetGpPct
    });
    return NextResponse.json(result);
  } catch(e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}
