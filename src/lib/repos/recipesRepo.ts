import path from "path";
import { promises as fs } from "fs";

export type BomRow = { ingredientId:string; qty:number; uom:"g"|"kg"|"ml"|"l"|"ea"; wastePct?:number };
export type Recipe = {
  id:string; name:string; bom:BomRow[];
  yieldPortions:number; overheadPct:number; packagingCost:number; targetGpPct:number;
};
export type RecipeLink = { recipeId:string; itemId:string };

export type RecipesFile = { recipes:Recipe[]; links:RecipeLink[] };

const P = path.join(process.cwd(),"data","recipes.json");

export async function getRecipesFile(): Promise<RecipesFile> {
  try { 
    await fs.access(P);
    const content = await fs.readFile(P,"utf8");
    return JSON.parse(content || '{"recipes":[],"links":[]}'); 
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
