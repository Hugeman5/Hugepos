import { NextResponse } from "next/server";
import { CURRENCY, VAT_RATE, roundPrice } from "@/lib/settings/pricing";

// Adjust these imports to your repo helpers if names differ:
import { getRecipesFile } from "@/lib/repos/recipesRepo";
import { getAllIngredients } from "@/lib/repos/ingredientsRepo";

type Num = number;
const n = (v: any, d = 0): Num => {
  const x = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : d;
};

// Try to derive a unit cost from common shapes on ingredients
function unitCost(ing: any): number {
  // Preferred: explicit unit cost
  if (Number.isFinite(ing?.unitCost)) return Number(ing.unitCost);

  // Fallbacks: pack cost / pack size
  const packCost = n(ing?.packCost);
  const packSize = Math.max(n(ing?.packSize, 1), 1);
  if (packCost > 0) return packCost / packSize;

  // Last resort
  return 0;
}

export async function POST(req: Request) {
  try {
    const { recipeId } = await req.json().catch(() => ({}));
    if (!recipeId) {
      return NextResponse.json({ error: "recipeId required" }, { status: 400 });
    }

    const [recipesFile, ingredients] = await Promise.all([
      getRecipesFile(),
      getAllIngredients(),
    ]);

    const recipe = (recipesFile?.recipes ?? []).find((r: any) => r.id === recipeId);
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const ingById = new Map(ingredients.map((i: any) => [i.id, i]));

    // Base cost = Σ (qty * unitCost * (1 + wastePct))
    let baseCost = 0;
    for (const row of recipe.bom ?? []) {
      const ing = ingById.get(row.ingredientId);
      const qty = n(row.qty);
      const uCost = unitCost(ing);
      const waste = Math.max(n(row.wastePct), 0);
      baseCost += qty * uCost * (1 + waste);
    }

    const overheadPct = Math.max(n(recipe.overheadPct), 0);
    const packaging = Math.max(n(recipe.packagingCost), 0);

    const overhead = baseCost * overheadPct + packaging;
    const totalCost = baseCost + overhead;

    const portions = Math.max(n(recipe.yieldPortions, 1), 1);
    const costPerPortion = totalCost / portions;

    // GP% is margin on ex-VAT price: price = cost / (1 - GP%)
    const gpPct = (() => {
      const g = n(recipe.targetGpPct, 0.6);
      return g > 0 && g < 1 ? g : 0.6;
    })();

    let exVatRSP = costPerPortion / (1 - gpPct);
    exVatRSP = roundPrice(exVatRSP);

    const vatRate = Number(VAT_RATE); // guarantee number
    const vatAmount = exVatRSP * vatRate;
    const incVatRSP = exVatRSP + vatAmount;

    return NextResponse.json({
      currency: CURRENCY,
      vatRate,                 // e.g. 0.15 -> UI shows 15%
      baseCost,
      overhead,
      totalCost,
      costPerPortion,
      exVatRSP,
      incVatRSP,
      vatAmount,
      gp: exVatRSP - costPerPortion,
      gpPct,
    });
  } catch (e) {
    return NextResponse.json({ error: "Costing failed" }, { status: 500 });
  }
}
