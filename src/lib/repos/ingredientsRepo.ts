
import path from "path";
import { promises as fs } from "fs";
import { type SupplierItem } from "./supplierItemsRepo";
import { slug } from "../purchasing";

export type Uom = "g" | "kg" | "ml" | "l" | "ea" | string;

export type Ingredient = {
  id: string;
  name: string;
  uom: Uom;
  // pack & pricing
  packSize?: number;
  priceExVat?: number;     // pack price
  priceIncVat?: number;    // pack price
  vatRate?: number;       // default 0.15 if missing
  // computed convenience
  unitCostExVat?: number;   // priceExVat/packSize
  unitCostIncVat?: number;  // priceIncVat/packSize
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
    await fs.writeFile(P, JSON.stringify(ingredients.map(withComputedUnitCosts), null, 2), "utf8");
}

export function withComputedUnitCosts(i: Ingredient): Ingredient {
  const vat = Number.isFinite(i.vatRate) ? (i.vatRate as number) : 0.15;
  const pack = Number(i.packSize) > 0 ? Number(i.packSize) : 1;
  const ex = Number.isFinite(i.priceExVat) ? Number(i.priceExVat) : undefined;
  const inc = Number.isFinite(i.priceIncVat) ? Number(i.priceIncVat) : (ex !== undefined ? ex * (1 + vat) : undefined);
  return {
    ...i,
    priceIncVat: inc,
    unitCostExVat: ex !== undefined ? ex / pack : undefined,
    unitCostIncVat: inc !== undefined ? inc / pack : undefined,
    vatRate: vat,
    packSize: pack
  };
}


export async function upsertManyFromSupplierItems(supplierId: string, items: SupplierItem[]) {
    const allIngredients = await getAllIngredients();
    const ingredientsMap = new Map(allIngredients.map(ing => [ing.id, ing]));

    for (const item of items) {
        const ingId = `ing_${supplierId}_${slug(item.sku || item.name)}`;
        
        const newIngredient: Ingredient = withComputedUnitCosts({
            id: ingId,
            name: item.name,
            uom: item.uom as Uom,
            packSize: item.packSize,
            priceExVat: item.priceExVat,
            priceIncVat: item.priceIncVat,
            vatRate: item.vatRate,
            source: 'supplier',
            supplierId: item.supplierId,
            supplierItemId: item.id,
            sku: item.sku
        });
        ingredientsMap.set(ingId, newIngredient);
    }
    
    await saveAllIngredients(Array.from(ingredientsMap.values()));
}
