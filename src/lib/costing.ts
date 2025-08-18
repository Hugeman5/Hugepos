
// src/lib/costing.ts
import { toBase } from "@/lib/uom";

export type IngredientPricing = {
  id: string;
  name: string;
  purchaseSize: number;          // e.g. 12.5 (kg) or 30 (ea)
  purchaseUom: "g" | "kg" | "ml" | "l" | "ea";
  priceIncVat: number;           // R per pack, incl VAT
  vatRate?: number;
};

export type BomRow = {
  ingredientId: string;
  qty: number | string;          // used in recipe
  uom?: string | null;           // row UOM (fallback to ingredient.purchaseUom)
  wastePct?: number | string;    // e.g. 0.1 = 10%
};

export type ComputeParams = {
  bom: BomRow[];
  ingredients: Record<string, IngredientPricing>;
  overheadPct: number;           // e.g. 0.1 (10%)
  packagingCostInc: number;      // R incl VAT
  targetGpPct: number;           // e.g. 0.6 (60%)
  vatRate: number;               // e.g. 0.15 (15%)
  yieldPortions: number;         // how many portions the recipe yields
  currency: string;              // "ZAR"
};

export function computeRecipeCost(p: ComputeParams) {
  const yieldPortions = Math.max(1, Number(p.yieldPortions || 1));
  const vatRate = Number(p.vatRate || 0);
  let baseCostInc = 0;

  for (const row of p.bom || []) {
    const ing = p.ingredients[row.ingredientId];
    if (!ing) continue;
    
    baseCostInc += lineCostIncVat({
        ingredient: ing,
        qty: row.qty,
        uom: row.uom,
        wastePct: row.wastePct,
    });
  }

  const overheadInc = baseCostInc * Number(p.overheadPct || 0);
  const totalCostInc = baseCostInc + overheadInc + Number(p.packagingCostInc || 0);

  const costPerPortionInc = totalCostInc / yieldPortions;
  const costPerPortionEx  = costPerPortionInc / (1 + vatRate);             // back out VAT

  // Hospitality GP% is usually on EX-VAT price:
  // GP% = (ExVatRSP - ExVatCost) / ExVatRSP
  // => ExVatRSP = ExVatCost / (1 - GP%)
  const exVatRSP  = costPerPortionEx / (1 - Number(p.targetGpPct || 0));
  const incVatRSP = exVatRSP * (1 + vatRate);
  const vatAmount = incVatRSP - exVatRSP;
  const gp        = exVatRSP - costPerPortionEx;
  const gpPct     = gp / exVatRSP;

  return {
    currency: p.currency,
    vatRate,
    baseCostInc,             // ingredients incl VAT
    overheadInc,             // overhead incl VAT
    totalCostInc,            // incl VAT
    costPerPortionInc,
    exVatRSP,
    incVatRSP,
    vatAmount,
    gp,
    gpPct,
  };
}

/** Helper for a single line in the dialog preview (incl VAT). */
export function lineCostIncVat(args: {
  ingredient: IngredientPricing;
  qty: number | string;
  uom?: string | null;
  wastePct?: number | string;
}) {
  const { ingredient } = args;
  const qty = Number(args.qty ?? 0);
  const waste = Number(args.wastePct ?? 0);
  const rowUom = (args.uom || ingredient.purchaseUom) as string;

  if (!rowUom) {
    // Cannot calculate without a UOM. Returning 0 prevents crashing the UI.
    // The calling component should handle this gracefully.
    return 0;
  }
  
  if (!ingredient.purchaseUom || !ingredient.purchaseSize) {
    console.warn(`Ingredient "${ingredient.name}" missing purchase info.`);
    return 0; // Cannot calculate cost without purchase info.
  }

  const effQty = qty * (1 + waste); // qty including waste

  const rb = toBase(effQty, rowUom);
  const pb = toBase(ingredient.purchaseSize, ingredient.purchaseUom);

  if (rb.kind !== pb.kind) {
    throw new Error(
      `UoM mismatch for "${ingredient.name}": row uses "${rowUom}" vs pack "${ingredient.purchaseUom}".`
    );
  }

  const packPriceInc = Number(ingredient.priceIncVat || 0);
  const unitPriceInc = packPriceInc / pb.base;
  return unitPriceInc * rb.base;
}
