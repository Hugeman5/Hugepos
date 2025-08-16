'use server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  type InventoryItem,
  type InventoryMove,
  type Ingredient,
  type Order,
  type Recipe,
} from './data';

const inventoryPath = path.join(process.cwd(), 'src', 'lib', 'data', 'inventory.json');
const movesPath = path.join(process.cwd(), 'src', 'lib', 'data', 'inventory_moves.json');
const ingredientsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'ingredients.json');
const recipesPath = path.join(process.cwd(), 'src', 'lib', 'data', 'recipes.json');


async function readJSONFile<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If the file doesn't exist, return a default value
      if (filePath.endsWith('inventory.json') || filePath.endsWith('inventory_moves.json') || filePath.endsWith('ingredients.json') || filePath.endsWith('recipes.json')) {
        return [] as T;
      }
    }
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getLevels(): Promise<InventoryItem[]> {
  return readJSONFile<InventoryItem[]>(inventoryPath);
}

export async function saveLevels(levels: InventoryItem[]): Promise<void> {
  await writeJSONFile(inventoryPath, levels);
}

export async function getMoves(): Promise<InventoryMove[]> {
    return readJSONFile<InventoryMove[]>(movesPath);
}

export async function appendMove(move: Omit<InventoryMove, 'id' | 'timestamp'>): Promise<InventoryMove> {
    const moves = await getMoves();
    const newMove: InventoryMove = {
        ...move,
        id: `move_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
    };
    moves.unshift(newMove); // Add to the beginning
    await writeJSONFile(movesPath, moves);
    return newMove;
}

export async function receiveStock(data: { ingredientId: string; quantity: number; note?: string; user?: string }): Promise<InventoryItem> {
    const levels = await getLevels();
    const item = levels.find(l => l.ingredientId === data.ingredientId);

    if (!item) {
        throw new Error(`Ingredient ${data.ingredientId} not found in inventory.`);
    }

    item.onHand += data.quantity;

    await appendMove({
        ingredientId: data.ingredientId,
        quantity: data.quantity,
        type: 'receive',
        note: data.note,
        user: data.user,
    });

    await saveLevels(levels);
    return item;
}

export async function adjustStock(data: { ingredientId: string; delta: number; note?: string; user?: string }): Promise<InventoryItem> {
    const levels = await getLevels();
    const item = levels.find(l => l.ingredientId === data.ingredientId);

    if (!item) {
        throw new Error(`Ingredient ${data.ingredientId} not found in inventory.`);
    }

    item.onHand += data.delta;
     if (item.onHand < 0) {
        // Decide on business logic: prevent going negative or allow it?
        // For now, let's just note it. Production system might throw error.
        console.warn(`Ingredient ${data.ingredientId} has negative stock: ${item.onHand}`);
    }


    await appendMove({
        ingredientId: data.ingredientId,
        quantity: data.delta,
        type: 'adjust',
        note: data.note,
        user: data.user,
    });

    await saveLevels(levels);
    return item;
}

export async function applyUsageFromOrder(order: Order): Promise<number> {
    const levels = await getLevels();
    const recipes = await readJSONFile<Recipe[]>(recipesPath);
    const usage: Record<string, number> = {};

    for (const orderItem of order.items) {
        const recipe = recipes.find(r => r.productId === orderItem.product.id);
        if (recipe) {
            for (const recipeItem of recipe.items) {
                const totalQuantity = recipeItem.quantity * orderItem.quantity;
                usage[recipeItem.ingredientId] = (usage[recipeItem.ingredientId] || 0) + totalQuantity;
            }
        }
    }
    
    let movesCount = 0;
    for (const ingredientId in usage) {
        const item = levels.find(l => l.ingredientId === ingredientId);
        const quantityUsed = usage[ingredientId];

        if (item) {
            item.onHand -= quantityUsed;
            await appendMove({
                ingredientId: ingredientId,
                quantity: -quantityUsed,
                type: 'sale',
                ref: order.id,
                user: 'system', // Or pass in current user
            });
            movesCount++;
        } else {
            console.warn(`Ingredient ${ingredientId} from a recipe was not found in inventory. Stock not updated.`);
        }
    }

    await saveLevels(levels);
    return movesCount;
}

export async function getSummary() {
    const levels = await getLevels();
    const ingredients = await readJSONFile<Ingredient[]>(ingredientsPath);

    const summary = ingredients.map(ing => {
        const level = levels.find(l => l.ingredientId === ing.id);
        const onHand = level?.onHand ?? 0;
        const reorderPoint = level?.reorderPoint ?? 0;
        return {
            ...ing,
            onHand,
            reorderPoint,
            status: onHand <= reorderPoint ? (onHand > 0 ? 'low' : 'out') : 'ok',
        };
    });

    return summary;
}
