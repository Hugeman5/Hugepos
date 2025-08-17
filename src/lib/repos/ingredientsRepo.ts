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
};

const P = path.join(process.cwd(), "data", "ingredients.json");

export async function readIngredients(): Promise<Ingredient[]> {
    try {
        await fs.access(P);
        return JSON.parse(await fs.readFile(P, "utf8"));
    } catch {
        return [];
    }
}
