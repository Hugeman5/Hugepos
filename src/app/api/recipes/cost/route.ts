
import { NextResponse } from "next/server";
import { getRecipesFile } from "@/lib/repos/recipesRepo";
import { getAllIngredients } from "@/lib/repos/ingredientsRepo";
import { computeRecipeCost } from "@/lib/costing";

export const dynamic = "force-dynamic";

function round2(n:number){ return Math.round((n + Number.EPSILON) * 100) / 100; }

export async function POST(req: Request){
  try{
    const { recipeId } = await req.json();
    if(!recipeId) return NextResponse.json({error:"recipeId required"},{status:400});

    const rf = await getRecipesFile();
    const recipe = rf.recipes.find(r => r.id === recipeId);
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    
    const ings = await getAllIngredients();
    const map = Object.fromEntries(
      ings.map(i => [
        i.id,
        {
          id: i.id,
          name: i.name,
          purchaseSize: Number(i.purchaseSize || 0),
          purchaseUom: i.purchaseUom,
          priceIncVat: Number(i.priceIncVat || 0),
        },
      ])
    );
    
    const result = computeRecipeCost({
      bom: recipe.bom || [],
      ingredients: map,
      overheadPct: Number(recipe.overheadPct || 0),
      packagingCostInc: Number(recipe.packagingCost || 0),
      targetGpPct: Number(recipe.targetGpPct || 0.6),
      vatRate: 0.15,                 // South Africa
      yieldPortions: Number(recipe.yieldPortions || 1),
      currency: "ZAR",
    });

    const roundedResult = Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        typeof value === 'number' ? round2(value) : value
      ])
    );
    
    return NextResponse.json(roundedResult);

  }catch(e:any){
    return NextResponse.json({error:e?.message ?? "Costing failed"},{status:500});
  }
}
