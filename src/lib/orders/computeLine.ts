
import { round2 } from "@/lib/money";

export type ModifierChoice = { id: string; qty?: number };
export type MenuItem = {
  id: string; name: string; priceCents: number; taxCode?: string; modifierSetIds?: string[];
};
export type ModifierSet = { id: string; name: string; options: { id: string; name: string; priceDeltaCents?: number }[] };
export type TaxCode = { code: string; rate: number };

export type MenuShape = {
  items: MenuItem[];
  modifierSets?: ModifierSet[];
  taxCodes?: TaxCode[];
  currency?: string;
  defaultTaxRate?: number; // fall back to 0.15 if missing
};

export type ComputeInput = {
  menu: MenuShape;
  itemId: string;
  qty: number;
  choices?: Record<string, ModifierChoice[]>; // keyed by modifierSetId
};

function exFromInc(inc: number, rate: number) {
  return inc / (1 + rate);
}

export function computeLine({ menu, itemId, qty, choices }: ComputeInput) {
  if (!qty || qty <= 0) qty = 1;

  const item = menu.items.find(i => i.id === itemId);
  if (!item) throw new Error("Item not found");

  const modSets = menu.modifierSets ?? [];
  const taxCodes = menu.taxCodes ?? [];
  const taxCode = taxCodes.find(tc => tc.code === item.taxCode);
  const taxRate = taxCode?.rate ?? menu.defaultTaxRate ?? 0.15;

  // base price
  let unitExVat = Number(item.priceCents || 0) / 100;

  // apply modifiers (priceDelta adds to ex-VAT)
  if (item.modifierSetIds?.length && choices) {
    for (const setId of item.modifierSetIds) {
      const set = modSets.find(s => s.id === setId);
      if (!set) continue;
      const picks = choices[setId] || [];
      for (const pick of picks) {
        const ch = set.options.find(c => c.id === pick.id);
        if (!ch) continue;
        const q = Number(pick.qty ?? 1);
        unitExVat += (Number(ch.priceDeltaCents ?? 0) / 100) * q;
      }
    }
  }

  unitExVat = round2(unitExVat);
  const lineExVat = round2(unitExVat * qty);
  const tax = round2(lineExVat * taxRate);
  const lineIncVat = round2(lineExVat + tax);

  return {
    itemId: item.id,
    name: item.name,
    qty,
    unitExVat,
    lineExVat,
    taxRate,
    tax,
    lineIncVat,
    currency: menu.currency || "ZAR",
  };
}
