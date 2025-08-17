




import { promises as fs } from 'fs';
import path from 'path';
import { type Order, type Cart, type User, type OrderLine, type CartLineMod, OrderTotal } from './data';
import * as menuRepo from './menuRepo';
import * as pricing from './pricing';
import * as stationsRepo from './stationsRepo';
import * as kdsRepo from './kdsRepo';

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
    try {
        const seq = await readJSONFile(sequencePath, { order: 1001, shift: 1 });
        const nextNum = seq.order;
        await writeJSONFile(sequencePath, { ...seq, order: nextNum + 1 });
        return nextNum;
    } catch(e) {
        console.error("Could not get next order number", e);
        // Fallback to a random high number to avoid collisions
        return Math.floor(Date.now() / 1000);
    }
}

export async function createDraft(user: { uid: string, name: string }, cart: Cart, shiftId?: string): Promise<Order> {
  const menu = await menuRepo.getMenu();

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

  const totals = await pricing.computeOrder(cart, menu);

  const orderLines = await Promise.all(cart.lines.map(async (line) => {
    const product = menu.items.find(i => i.id === line.productId);
    if (!product) throw new Error(`Invalid product ID in cart: ${line.productId}`);
    
    const computedLine = await pricing.computeLine(line, product, menu);
    
    const stationId = await stationsRepo.resolveStationForProduct(product.id, product.catId);

    return {
      id: line.id,
      lineId: `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitPrice: product.priceCents,
      mods: computedLine.mods,
      lineTotal: computedLine.total,
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
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, limit);
}

export async function listByShift(shiftId: string): Promise<Order[]> {
    const orders = await readJSONFile<Order[]>(ordersPath, []);
    return orders.filter(o => o.shiftId === shiftId && (o.status === 'PAID' || o.status === 'COMPLETED'));
}


export async function sendToKitchen(orderId: string): Promise<void> {
    const order = await getOrder(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const linesByStation: Record<string, OrderLine[]> = {};

    for (const line of order.lines) {
        // Only send lines that are still queued
        if (line.prep.status === 'queued') {
            const stationId = line.prep.stationId;
            if (!linesByStation[stationId]) {
                linesByStation[stationId] = [];
            }
            linesByStation[stationId].push(line);
            line.prep.status = 'in_progress'; // Mark as sent
        }
    }

    for (const stationId in linesByStation) {
        const stationLines = linesByStation[stationId];
        await kdsRepo.addTicket({
            orderId: order.id,
            table: order.service?.tableId || `Order #${order.number}`,
            station: stationId,
            lines: stationLines.map(l => ({
                name: l.name,
                qty: l.qty,
                mods: l.mods.map(m => m.optionName).join(', '),
            })),
        });
    }

    await saveOrder(order);
}

export async function recalculateTotals(orderId: string): Promise<Order> {
    const order = await getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const menu = await menuRepo.getMenu();
    // Map order lines to cart lines for pricing engine
    const cart: Cart = {
        lines: order.lines.map(l => ({
            id: l.id,
            productId: l.productId,
            qty: l.qty,
            subtotal: 0, tax: 0, total: 0,
            mods: l.mods.reduce((acc, mod) => {
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

    const newTotals = await pricing.computeOrder(cart, menu);
    order.totals = {
      subtotal: newTotals.subtotal,
      tax: newTotals.tax,
      total: newTotals.total,
      discount: newTotals.discount,
    }

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

