
import path from "path";
import { promises as fs } from "fs";
import { type Recipe as DataRecipe, type RecipeLink, type RecipesFile as DataRecipesFile } from '../data';

export type BomRow = { ingredientId:string; qty:number; uom:"g"|"kg"|"ml"|"l"|"ea"; wastePct?:number };

// Use a more specific type for the repo layer
export type Recipe = {
  id:string; name:string; bom:BomRow[];
  yieldPortions:number; overheadPct:number; packagingCost:number; targetGpPct:number;
};

export type RecipesFile = { recipes:Recipe[]; links:RecipeLink[] };

const P = path.join(process.cwd(),"data","recipes.json");

export async function getRecipesFile(): Promise<RecipesFile> {
  try { 
    await fs.access(P);
    const content = await fs.readFile(P,"utf8");
    const data = JSON.parse(content || '{"recipes":[],"links":[]}');
    // Ensure backwards compatibility with old Recipe format
    const recipes = (data.recipes || []).map((r: any) => ({
      ...r,
      bom: (r.bom || []).map((b: any) => ({
        ...b,
        qty: Number(b.qty) || 0,
        uom: String(b.uom || 'g')
      })),
      yieldPortions: Number(r.yieldPortions) || 1,
      overheadPct: Number(r.overheadPct) || 0,
      packagingCost: Number(r.packagingCost) || 0,
      targetGpPct: Number(r.targetGpPct) || 0.6,
    }))
    return { ...data, recipes };
  }
  catch { return { recipes:[], links:[] }; }
}

export async function writeRecipes(data:RecipesFile){
  await fs.mkdir(path.dirname(P), { recursive:true });
  await fs.writeFile(P, JSON.stringify(data, null, 2), "utf8");
}
export async function upsertRecipe(r:Recipe){
  const file = await getRecipesFile();
  const i = file.recipes.findIndex(x=>x.id===r.id);
  if (i>=0) file.recipes[i]=r; else file.recipes.push(r);
  await writeRecipes(file);
}
export async function deleteRecipe(id:string){
  const file = await getRecipesFile();
  file.recipes = file.recipes.filter(r=>r.id!==id);
  file.links = file.links.filter(l=>l.recipeId!==id);
  await writeRecipes(file);
}
export async function linkRecipe(recipeId:string, itemId:string){
  const file = await getRecipesFile();
  const i = file.links.findIndex(l=>l.recipeId===recipeId);
  if (i>=0) file.links[i].itemId=itemId; else file.links.push({recipeId,itemId});
  await writeRecipes(file);
}

export async function getRecipeIdForItem(itemId: string): Promise<string | null> {
    const file = await getRecipesFile();
    return file.links.find(link => link.itemId === itemId)?.recipeId || null;
}

export async function getSettings() {
    const file = await getRecipesFile();
    return (file as any).settings || { decrementOn: 'send' };
}
