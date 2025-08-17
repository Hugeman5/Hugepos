
import { toBase } from "@/lib/uom";
import type { Ingredient } from "@/lib/repos/ingredientsRepo";

export function lineCostIncVat(args:{
  ingredient: Ingredient; qty:number; uom:string; wastePct:number;
}){
  const { ingredient, qty, uom, wastePct } = args;
  const eff = qty * (1 + (wastePct || 0));
  const recipeBase = toBase(eff, uom);
  const packBase   = toBase(ingredient.purchaseSize, ingredient.purchaseUom);
  if (recipeBase.kind !== packBase.kind) throw new Error("UoM mismatch");
  const unitPriceInc = (ingredient.priceIncVat || 0) / packBase.base;
  return unitPriceInc * recipeBase.base;
}
