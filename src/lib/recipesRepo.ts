
import { promises as fs } from 'fs';
import path from 'path';
import { type RecipesFile, type Recipe, type RecipeLink, type Ingredient } from './data';
import * as inventoryRepo from './inventoryRepo';

const dataDir = path.join(process.cwd(), 'data');
const recipesPath = path.join(dataDir, 'recipes.json');

const defaultRecipesFile: RecipesFile = {
    recipes: [],
    links: [],
    settings: {
        decrementOn: 'send',
    },
};

async function readRecipesFile(): Promise<RecipesFile> {
    try {
        await fs.access(recipesPath);
        const data = await fs.readFile(recipesPath, 'utf-8');
        return JSON.parse(data) as RecipesFile;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await writeRecipesFile(defaultRecipesFile);
            return defaultRecipesFile;
        }
        throw error;
    }
}

async function writeRecipesFile(data: RecipesFile): Promise<void> {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(recipesPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getRecipes(): Promise<RecipesFile> {
    return await readRecipesFile();
}

export async function saveRecipes(recipesFile: RecipesFile): Promise<void> {
    await writeRecipesFile(recipesFile);
}

export async function getSettings() {
    const file = await getRecipes();
    return file.settings;
}

export async function getRecipeIdForItem(itemId: string): Promise<string | null> {
    const file = await getRecipes();
    return file.links.find(link => link.itemId === itemId)?.recipeId || null;
}

export async function getCostForRecipe(recipe: Recipe): Promise<number> {
    const ingredients = await inventoryRepo.getIngredients();
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));
    
    let totalCostCents = 0;
    for(const item of recipe.bom) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (ingredient) {
            // Cost per single UOM (e.g., cost per gram if pack is kg)
            const costPerUom = ingredient.costCents / ingredient.packSize;
            totalCostCents += costPerUom * item.qty;
        }
    }
    return totalCostCents;
}
