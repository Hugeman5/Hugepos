
import { toBase } from "@/lib/uom";
import type { Ingredient } from "@/lib/repos/ingredientsRepo";

/**
 * Compute line cost (Inc VAT) using the ingredient pack info.
 * Falls back to ingredient.purchaseUom if row.uom is missing.
 */
export function lineCostIncVat(args: {
  ingredient: Pick<Ingredient, "name" | "purchaseSize" | "purchaseUom" | "priceIncVat">;
  qty: number | string;
  uom?: string | null;
  wastePct?: number | string;
}) {
  const { ingredient } = args;
  const qty = Number(args.qty ?? 0);
  const waste = Number(args.wastePct ?? 0) / 100;
  const rowUom = (args.uom ?? ingredient.purchaseUom) as string;

  if (!rowUom) {
    console.warn(`Missing UoM for "${ingredient.name}". Cost will be 0.`);
    return 0;
  }
  if (!ingredient.purchaseUom || !ingredient.purchaseSize) {
    console.warn(`Ingredient "${ingredient.name}" missing purchase info. Cost will be 0.`);
    return 0;
  }

  const effQty = qty * (1 + waste); // qty including waste
  const recipeBase = toBase(effQty, rowUom);                     // g / ml / ea
  const packBase   = toBase(ingredient.purchaseSize, ingredient.purchaseUom);

  if (recipeBase.kind !== packBase.kind) {
    throw new Error(
      `UoM mismatch for "${ingredient.name}": row uses "${rowUom}" vs pack "${ingredient.purchaseUom}".`
    );
  }

  const packPriceInc = Number(ingredient.priceIncVat ?? 0);
  if(packBase.base === 0) return 0; // Avoid division by zero
  const unitPriceInc = packPriceInc / packBase.base;             // price per base unit
  return unitPriceInc * recipeBase.base;                         // line cost (Inc VAT)
}
