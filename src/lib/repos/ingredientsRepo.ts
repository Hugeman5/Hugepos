
import path from "path";
import { promises as fs } from "fs";
import { type SupplierItem } from "./supplierItemsRepo";
import { slug } from "../purchasing";

export type Uom = "g" | "kg" | "ml" | "l" | "ea";

export type Ingredient = {
  id: string;
  name: string;
  uom: Uom;
  // pack & pricing
  packSize?: number;
  priceExVat?: number;     // pack price
  priceIncVat?: number;    // pack price (preferred for costing)
  vatRate?: number;
  // computed convenience
  unitCostIncVat?: number; // priceIncVat / packSize
  unitCostExVat?: number;  // priceExVat / packSize
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
        return JSON.parse(content || '[]');
    } catch {
        return [];
    }
}

async function saveAllIngredients(ingredients: Ingredient[]): Promise<void> {
    await fs.mkdir(path.dirname(P), { recursive: true });
    await fs.writeFile(P, JSON.stringify(ingredients, null, 2), "utf8");
}


export async function upsertManyFromSupplierItems(supplierId: string, items: SupplierItem[]) {
    const allIngredients = await getAllIngredients();
    const ingredientsMap = new Map(allIngredients.map(ing => [ing.id, ing]));

    for (const item of items) {
        const ingId = `ing_${supplierId}_${slug(item.sku || item.name)}`;
        const packSize = item.packSize > 0 ? item.packSize : 1;

        const newIngredient: Ingredient = {
            id: ingId,
            name: item.name,
            uom: item.uom as Uom,
            packSize: item.packSize,
            priceExVat: item.priceExVat,
            priceIncVat: item.priceIncVat,
            vatRate: item.vatRate,
            unitCostIncVat: item.priceIncVat ? item.priceIncVat / packSize : undefined,
            unitCostExVat: item.priceExVat ? item.priceExVat / packSize : undefined,
            source: 'supplier',
            supplierId: item.supplierId,
            supplierItemId: item.id,
            sku: item.sku
        };
        ingredientsMap.set(ingId, newIngredient);
    }
    
    await saveAllIngredients(Array.from(ingredientsMap.values()));
}
