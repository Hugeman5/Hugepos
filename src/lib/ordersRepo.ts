

import { promises as fs } from 'fs';
import path from 'path';
import { type Order, type Cart, type User, type OrderLine, type CartLineMod, OrderTotal } from './data';
import * as menuRepo from './menuRepo';
import * as pricing from './pricing';
import * as stationsRepo from './stationsRepo';
import * as kdsRepo from './kdsRepo';
import * as inventoryRepo from './inventoryRepo';
import * as recipesRepo from './recipesRepo';
import { type computeLine } from './orders/computeLine';
import { nextSeq } from './sequence';
import * as shiftsRepo from './shiftsRepo';

const dataDir = path.join(process.cwd(), 'data');
const ordersPath = path.join(dataDir, 'orders.json');


async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`File not found: ${filePath}, returning default value.`);
      // Try to create the directory and file
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      } catch (writeError) {
        console.error(`Failed to create default file ${filePath}:`, writeError);
      }
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    // If parsing fails, it might be an empty or corrupted file.
    return defaultValue;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Failed to write to ${filePath}:`, error);
        throw error;
    }
}


export async function nextOrderNumber(): Promise<number> {
    return nextSeq('order');
}

export async function createDraft(user: { uid: string, name: string }, cart: Cart, shiftId?: string): Promise<Order> {
  const menu = await menuRepo.getMenu();
  const { computeOrder: computeOrderPricing } = await import('./pricing');

  // Validate modifiers before creating the order
  for (const line of cart.lines) {
      const item = menu.items.find(i => i.id === line.productId);
      if (item?.modifierSetIds) {
          for (const setId of item.modifierSetIds) {
              const set = menu.modifierSets.find(ms => ms.id === setId);
              if (set?.required) {
                  const selection = line.mods.find(m => m.setId === setId);
                  if (!selection || selection.optionIds.length < set.min) {
                       throw new Error(`Missing required modifier from set "${set.name}" for item "${item.name}"`);
                  }
              }
          }
      }
  }

  const { lines: pricedLines, ...totals } = await computeOrderPricing(cart, menu);

  const orderLines = await Promise.all(pricedLines.map(async (line) => {
    const product = menu.items.find(i => i.id === line.productId);
    if (!product) throw new Error(`Invalid product ID in cart: ${line.productId}`);
    
    const stationId = await stationsRepo.resolveStationForProduct(product.id, product.catId);

    return {
      ...line, // Spread the computed line details (name, totals, etc.)
      id: line.id, // Keep the temporary client-side ID
      lineId: `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      productId: product.id,
      unitPrice: product.priceCents,
      prep: {
          stationId: stationId,
          status: 'queued'
      }
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
    shiftId: shiftId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await saveOrder(order);
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
    const orders = await listRecent(1000); // search more deeply for a specific order
    const order = orders.find(o => o.id === id);
    if (!order) return null;
    return order;
}

export async function saveOrder(order: Order, write = true): Promise<void> {
    if (!write) return;
    const orders = await readJSONFile<Order[]>(ordersPath, []);
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
    // Ensure sorting by timestamp descending
    return orders
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
}

export async function listByShift(shiftId: string): Promise<Order[]> {
    const orders = await readJSONFile<Order[]>(ordersPath, []);
    return orders.filter(o => o.shiftId === shiftId && (o.status === 'PAID' || o.status === 'COMPLETED'));
}

export async function recalculateTotals(orderId: string): Promise<Order> {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const menu = await menuRepo.getMenu();
    const { computeOrder: computeOrderPricing } = await import('./pricing');
    // Map order lines to cart lines for pricing engine
    const cart: Cart = {
        lines: order.lines.map(l => ({
            id: l.id,
            lineId: l.lineId,
            productId: l.productId,
            qty: l.qty,
            subtotal: 0, tax: 0, total: 0,
            mods: (l.mods || []).reduce((acc, mod) => {
                let found = acc.find(m => m.setId === mod.setId);
                if (!found) {
                    found = { setId: mod.setId, optionIds: [] };
                    acc.push(found);
                }
                found.optionIds.push(mod.optionId);
                return acc;
            }, [] as CartLineMod[])
        }))
    };

    const { lines: _, ...newTotals } = await computeOrderPricing(cart, menu);
    order.totals = {
      subtotal: newTotals.subtotal / 100,
      tax: newTotals.tax / 100,
      total: newTotals.total / 100,
      discount: (newTotals.discount || 0) / 100,
    };
    
    // Apply promotions
    const { evaluateOrder } = await import('./promotionsRepo');
    const promoResult = await evaluateOrder(order);
    
    order.discounts = promoResult.discounts;
    // Update totals with promotion discounts
    order.totals.discount = (order.totals.discount || 0) + (promoResult.totalDiscount / 100);
    order.totals.total = Math.max(0, order.totals.total - (promoResult.totalDiscount / 100));


    await saveOrder(order);
    return order;
}

export async function moveLine(lineId: string, fromOrderId: string, toOrderId: string): Promise<void> {
    const fromOrder = await getOrder(fromOrderId);
    const toOrder = await getOrder(toOrderId);

    if (!fromOrder || !toOrder) {
        throw new Error("One or both orders not found.");
    }

    const lineIndex = fromOrder.lines.findIndex(l => l.lineId === lineId);
    if (lineIndex === -1) {
        throw new Error("Line not found in the source order.");
    }

    const [lineToMove] = fromOrder.lines.splice(lineIndex, 1);
    toOrder.lines.push(lineToMove);

    await recalculateTotals(fromOrderId);
    await recalculateTotals(toOrderId);
}

export async function createOrderFromLines(originalOrder: Order, lines: OrderLine[]): Promise<Order> {
    const newOrder: Order = {
        ...originalOrder,
        id: `ord_${Date.now()}`,
        number: await nextOrderNumber(),
        lines: lines,
        totals: { subtotal: 0, tax: 0, total: 0 }
    };
    await saveOrder(newOrder, false); // Save without recalculating totals yet
    return recalculateTotals(newOrder.id);
}

export async function sendOrderToKitchen(orderId: string): Promise<Order> {
    const order = await getOrder(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    order.status = 'PAID'; // Mark as sent to KDS
    if (!order.ticketNo) {
        order.ticketNo = await nextSeq('ticket');
    }

    for (const line of order.lines) {
        if (line.prep.status === 'queued') {
            line.prep.status = 'in_progress';
        }
    }

    const recipeSettings = await recipesRepo.getSettings();
    if(recipeSettings.decrementOn === 'send'){
      await inventoryRepo.applyUsageFromOrder(order);
    }

    await saveOrder(order);
    return order;
}
