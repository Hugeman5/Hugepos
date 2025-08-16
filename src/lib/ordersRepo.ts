'use server';
import { promises as fs } from 'fs';
import path from 'path';
import { type Order, type Cart, type User } from './data';
import * as catalogRepo from './catalogRepo';
import * as pricing from './pricing';

const dataDir = path.join(process.cwd(), 'data');
const ordersPath = path.join(dataDir, 'orders.json');
const sequencePath = path.join(dataDir, 'sequence.json');


async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`File not found: ${filePath}, returning default value.`);
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function nextOrderNumber(): Promise<number> {
    try {
        const seq = await readJSONFile(sequencePath, { order: 1001 });
        const nextNum = seq.order;
        await writeJSONFile(sequencePath, { order: nextNum + 1 });
        return nextNum;
    } catch(e) {
        console.error("Could not get next order number", e);
        // Fallback to a random high number to avoid collisions
        return Math.floor(Date.now() / 1000);
    }
}

export async function createDraft(user: { uid: string, name: string }, cart: Cart): Promise<Order> {
  const [products, allModifiers, taxes] = await Promise.all([
    catalogRepo.getProducts(),
    catalogRepo.getModifiers(),
    catalogRepo.getTaxes(),
  ]);

  const productMap = new Map(products.map(p => [p.id, p]));
  const modifierMap = new Map(allModifiers.map(m => [m.id, m]));
  const taxMap = new Map(taxes.map(t => [t.id, t]));

  const totals = await pricing.computeOrder(cart, productMap, modifierMap, taxMap);

  const orderLines = await Promise.all(cart.lines.map(async (line) => {
    const product = productMap.get(line.productId);
    if (!product) throw new Error(`Invalid product ID in cart: ${line.productId}`);
    
    const tax = taxMap.get(product.taxId);
    if (!tax) throw new Error(`Invalid tax ID on product: ${product.taxId}`);

    const lineModifiers = product.modifierIds?.map(id => modifierMap.get(id)).filter(Boolean) as any[];

    const computedLine = await pricing.computeLine(line, product, lineModifiers, tax);

    return {
      id: line.id,
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitPrice: product.price,
      mods: (await Promise.all(line.mods.map(async mod => {
        const modDef = modifierMap.get(mod.id);
        if (!modDef) return null;
        const modDelta = await pricing.getModDelta(mod, modifierMap);

        if (modDef.type === 'choice' && mod.optionId) {
            const opt = modDef.options?.find(o => o.id === mod.optionId);
            return { id: mod.id, name: opt?.name ?? 'Unknown', delta: modDelta, optionId: mod.optionId };
        }
        if (modDef.type === 'count' && mod.count) {
             return { id: mod.id, name: modDef.name, delta: modDelta, count: mod.count };
        }
        return null;
      }))).filter(Boolean) as any[],
      lineTotal: computedLine.total,
    };
  }));

  const order: Order = {
    id: `ord_${Date.now()}`,
    number: await nextOrderNumber(),
    ts: new Date().toISOString(),
    user,
    status: 'DRAFT',
    lines: orderLines,
    totals,
  };
  
  await saveOrder(order);
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
    const orders = await listRecent();
    return orders.find(o => o.id === id) || null;
}

export async function saveOrder(order: Order): Promise<void> {
    const orders = await listRecent();
    const index = orders.findIndex(o => o.id === order.id);
    if (index > -1) {
        orders[index] = order;
    } else {
        orders.unshift(order);
    }
    await writeJSONFile(ordersPath, orders);
}

export async function listRecent(limit = 50): Promise<Order[]> {
    const orders = await readJSONFile<Order[]>(ordersPath, []);
    return orders.slice(0, limit);
}
