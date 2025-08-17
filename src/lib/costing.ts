import { getSettings } from "./settings";

type U = "g"|"kg"|"ml"|"l"|"ea";

export function toBase(q:number,u:U): {qty:number, base:"g"|"ml"|"ea"} {
  if (u==="g")  return { qty:q, base:"g" };
  if (u==="kg") return { qty:q*1000, base:"g" };
  if (u==="ml") return { qty:q, base:"ml" };
  if (u==="l")  return { qty:q*1000, base:"ml" };
  return { qty:q, base:"ea" };
}

// ingredient cost per base unit
export function costPerBaseUnit(ing:{
  purchasePrice:number; purchaseUom:U; purchaseQty:number; baseUom:"g"|"ml"|"ea"; yieldPct?:number;
}) {
  const base = toBase(ing.purchaseUom, ing.purchaseUom).base;
  const totalBase = base==="g"||base==="ml" ? toBase(ing.purchaseQty, ing.purchaseUom).qty : ing.purchaseQty;
  const usable = totalBase * (ing.yieldPct ?? 1);
  return ing.purchasePrice / Math.max(usable, 1e-9);
}

export async function computeRecipeCost(args:{
  bom: Array<{ingredient:any; qty:number; uom:U; wastePct?:number}>;
  packagingCost:number;
  overheadPct:number;     // e.g. 0.10
  yieldPortions:number;   // number of saleable portions
  targetGpPct:number;     // e.g. 0.60
}) {
  const s = await getSettings();
  const baseCost = args.bom.reduce((sum,row)=>{
    if (!row.ingredient) return sum;
    const perBase = costPerBaseUnit({
      purchasePrice: row.ingredient.purchasePrice,
      purchaseUom: row.ingredient.purchaseUom,
      purchaseQty: row.ingredient.purchaseQty,
      baseUom: row.ingredient.baseUom,
      yieldPct: row.ingredient.yieldPct ?? 1
    });
    const { qty, base } = toBase(row.qty, row.uom as U);
    const waste = 1 + (row.wastePct ?? 0);
    return sum + (qty * perBase * waste);
  }, 0);

  const overhead = baseCost * (args.overheadPct ?? 0);
  const totalCost = baseCost + overhead + (args.packagingCost ?? 0);
  const costPerPortion = totalCost / Math.max(args.yieldPortions,1);

  // pricing: GP% is calculated on EX-VAT price
  const exVatRSP = costPerPortion / Math.max(1 - (args.targetGpPct ?? 0), 1e-9);
  const vat = exVatRSP * s.vatRate;
  let incVatRSP = exVatRSP + vat;

  // simple rounding rules
  if (s.rounding === "99c") incVatRSP = Math.floor(incVatRSP) + 0.99;
  if (s.rounding === "95c") incVatRSP = Math.floor(incVatRSP) + 0.95;

  const gp = exVatRSP - costPerPortion;
  const gpPct = gp > 0 && exVatRSP > 0 ? gp / exVatRSP : 0;

  return {
    currency: s.currency,
    vatRate: s.vatRate,
    baseCost, overhead, totalCost, costPerPortion,
    exVatRSP: round2(exVatRSP),
    incVatRSP: round2(incVatRSP),
    vatAmount: round2(incVatRSP - exVatRSP),
    gp: round2(gp), gpPct: +(gpPct*100).toFixed(2)
  };
}

function round2(n:number){ return Math.round(n*100)/100; }
