

import { type SupplierItem } from "./repos/supplierItemsRepo";
import { round2 } from "@/lib/money";
import { type Settings } from "./settingsRepo";

export function priceIncFromEx(priceEx:number, vatRate:number){ return round2(priceEx * (1 + vatRate)); }

export function toPOLines(items: SupplierItem[], qtyById: Record<string, number>, settings: Settings) {
  const { defaultVatRate } = settings.vat;
  return items.map(it => {
    const qty = qtyById[it.id] ?? 0;
    const vat = it.vatRate ?? defaultVatRate ?? 0.15;
    const ex = round2(qty * it.priceExVat);
    const v  = round2(ex * vat);
    const inc= round2(ex + v);
    return { itemId: it.id, name: it.name, sku: it.sku, qty, uom: it.uom, packSize: it.packSize, priceExVat: it.priceExVat, vatRate: vat, lineExVat: ex, lineVat: v, lineIncVat: inc };
  });
}
export function totals(lines: { lineExVat:number; lineVat:number; lineIncVat:number }[]){
  const ex = round2(lines.reduce((s,l)=>s+l.lineExVat,0));
  const v  = round2(lines.reduce((s,l)=>s+l.lineVat,0));
  const inc= round2(lines.reduce((s,l)=>s+l.lineIncVat,0));
  return { exVat: ex, vat: v, incVat: inc };
}
export const slug = (s:string)=> s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
