import path from "path";
import { promises as fs } from "fs";

export type Uom = "g" | "kg" | "ml" | "l" | "ea";

export type Ingredient = {
    id: string;
    name: string;
    purchasePrice: number;
    purchaseUom: Uom;
    purchaseQty: number;
    baseUom: "g" | "ml" | "ea";
    yieldPct: number;
    unitCost?: number; // Optional pre-calculated cost per baseUom
    packCost?: number; // Alias for purchasePrice
    packSize?: number; // Alias for purchaseQty
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
