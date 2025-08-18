

import path from "path";
import { promises as fs } from "fs";
import { type SupplierItem } from "./supplierItemsRepo";
import { slug } from "../purchasing";

export type Uom = "g" | "kg" | "ml" | "l" | "ea" | string;

export type Ingredient = {
  id: string;
  name: string;
  purchaseUom: "g"|"kg"|"ml"|"l"|"ea";
  
  // Purchase info (single source of truth from supplier catalog or manual entry)
  purchaseSize: number;
  priceExVat?: number;
  priceIncVat: number;
  vatRate?: number;
  
  // computed convenience
  unitCostExVat?: number;
  unitCostIncVat?: number;
  
  // source linkage
  source?: "supplier" | "manual";
  supplierId?: string;
  supplierItemId?: string;
  sku?: string;
};


const P = path.join(process.cwd(), "data", "ingredients.json");

export async function getAllIngredients(): Promise<Ingredient[]> {
    try {
        await fs.access(P);
        const content = await fs.readFile(P, "utf8");
        return JSON.parse(content || '[]').map(withComputedUnitCosts);
    } catch {
        return [];
    }
}

async function saveAllIngredients(ingredients: Ingredient[]): Promise<void> {
    await fs.mkdir(path.dirname(P), { recursive: true });
    await fs.writeFile(P, JSON.stringify(ingredients, null, 2), "utf8");
}

export function withComputedUnitCosts(i: Ingredient): Ingredient {
  const vat = Number.isFinite(i.vatRate) ? (i.vatRate as number) : 0.15;
  const pack = Number(i.purchaseSize) > 0 ? Number(i.purchaseSize) : 1;
  
  const ex = Number.isFinite(i.priceExVat) ? Number(i.priceExVat) : undefined;
  let inc = Number.isFinite(i.priceIncVat) ? Number(i.priceIncVat) : (ex !== undefined ? ex * (1 + vat) : undefined);
  
  // Ensure inc has a value if possible
  if (inc === undefined) inc = 0;

  return {
    ...i,
    priceIncVat: inc as number,
    priceExVat: ex,
    unitCostExVat: ex !== undefined ? ex / pack : undefined,
    unitCostIncVat: inc !== undefined ? inc / pack : undefined,
    vatRate: vat,
    purchaseSize: pack
  };
}


export async function upsertManyFromSupplierItems(supplierId: string, items: SupplierItem[]) {
    const allIngredients = await getAllIngredients();
    const ingredientsMap = new Map(allIngredients.map(ing => [ing.id, ing]));

    for (const item of items) {
        const ingId = `ing_${supplierId}_${slug(item.sku || item.name)}`;
        
        const newIngredient: Ingredient = {
            id: ingId,
            name: item.name,
            purchaseUom: item.uom as any,
            purchaseSize: item.packSize,
            priceExVat: item.priceExVat,
            priceIncVat: item.priceIncVat!, // CSV import ensures this exists
            vatRate: item.vatRate,
            source: 'supplier',
            supplierId: item.supplierId,
            supplierItemId: item.id,
            sku: item.sku
        };
        ingredientsMap.set(ingId, newIngredient);
    }
    
    await saveAllIngredients(Array.from(ingredientsMap.values()).map(withComputedUnitCosts));
}
