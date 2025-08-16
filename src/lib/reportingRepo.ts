
import { promises as fs } from 'fs';
import path from 'path';
import { type Order, type Product, type Category, type Shift } from './data';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const dataDir = path.join(process.cwd(), 'data');

async function safeReadJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    // Return fallback if file doesn't exist or is empty/corrupt
    return fallback;
  }
}

type FilterParams = {
  from?: string | null;
  to?: string | null;
};

async function getFilteredOrders(params: FilterParams): Promise<Order[]> {
  const allOrders = await safeReadJson<Order[]>(path.join(dataDir, 'orders.json'), []);
  const fromDate = params.from ? startOfDay(parseISO(params.from)) : null;
  const toDate = params.to ? endOfDay(parseISO(params.to)) : null;

  return allOrders.filter(order => {
    if (order.status !== 'PAID') return false;
    const orderDate = parseISO(order.ts);
    if (fromDate && orderDate < fromDate) return false;
    if (toDate && orderDate > toDate) return false;
    return true;
  });
}

export async function salesOverview(params: FilterParams) {
  const orders = await getFilteredOrders(params);
  if (orders.length === 0) {
    return { gross: 0, net: 0, tax: 0, discounts: 0, orders: 0, avgTicket: 0, items: 0, itemsPerOrder: 0 };
  }

  const net = orders.reduce((sum, o) => sum + o.totals.total, 0);
  const tax = orders.reduce((sum, o) => sum + o.totals.tax, 0);
  const discounts = orders.reduce((sum, o) => sum + (o.totals.discount || 0), 0);
  const gross = net + discounts - tax; // Adjust based on how you define gross
  const orderCount = orders.length;
  const items = orders.reduce((sum, o) => sum + o.lines.reduce((isum, l) => isum + l.qty, 0), 0);

  return {
    gross,
    net,
    tax,
    discounts,
    orders: orderCount,
    avgTicket: orderCount > 0 ? net / orderCount : 0,
    items,
    itemsPerOrder: orderCount > 0 ? items / orderCount : 0,
  };
}

export async function salesByDay(params: FilterParams) {
  const orders = await getFilteredOrders(params);
  const byDay = new Map<string, { day: string; net: number; orders: number; items: number }>();

  for (const order of orders) {
    const day = order.ts.split('T')[0];
    const entry = byDay.get(day) || { day, net: 0, orders: 0, items: 0 };
    entry.net += order.totals.total;
    entry.orders += 1;
    entry.items += order.lines.reduce((sum, l) => sum + l.qty, 0);
    byDay.set(day, entry);
  }

  return Array.from(byDay.values()).sort((a,b) => a.day.localeCompare(b.day));
}

export async function salesByHour(params: FilterParams) {
    const orders = await getFilteredOrders(params);
    const byHour = new Map<string, { hour: string; net: number; orders: number; items: number }>();

    for (const order of orders) {
        const date = parseISO(order.ts);
        const hour = `${order.ts.split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`;
        const entry = byHour.get(hour) || { hour, net: 0, orders: 0, items: 0 };
        entry.net += order.totals.total;
        entry.orders += 1;
        entry.items += order.lines.reduce((sum, l) => sum + l.qty, 0);
        byHour.set(hour, entry);
    }
    return Array.from(byHour.values()).sort((a,b) => a.hour.localeCompare(b.hour));
}


export async function salesByCategory(params: FilterParams) {
  const orders = await getFilteredOrders(params);
  const products = await safeReadJson<Product[]>(path.join(dataDir, 'products.json'), []);
  const categories = await safeReadJson<Category[]>(path.join(dataDir, 'categories.json'), []);
  const productMap = new Map(products.map(p => [p.id, p]));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const byCategory = new Map<string, { categoryId: string; categoryName: string; net: number; qty: number }>();

  for (const order of orders) {
    for (const line of order.lines) {
      const product = productMap.get(line.productId);
      const categoryId = product?.categoryId || 'uncategorized';
      const categoryName = categoryMap.get(categoryId) || 'Uncategorized';
      
      const entry = byCategory.get(categoryId) || { categoryId, categoryName, net: 0, qty: 0 };
      entry.net += line.lineTotal;
      entry.qty += line.qty;
      byCategory.set(categoryId, entry);
    }
  }

  return Array.from(byCategory.values()).sort((a,b) => b.net - a.net);
}

export async function salesByItem(params: FilterParams & { top?: number }) {
  const orders = await getFilteredOrders(params);
  const products = await safeReadJson<Product[]>(path.join(dataDir, 'products.json'), []);
   const categories = await safeReadJson<Category[]>(path.join(dataDir, 'categories.json'), []);
  const productMap = new Map(products.map(p => [p.id, p]));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const byItem = new Map<string, { productId: string; name: string; categoryName: string; qty: number; net: number }>();

  for (const order of orders) {
    for (const line of order.lines) {
      const product = productMap.get(line.productId);
      const name = product?.name || line.name;
       const categoryName = categoryMap.get(product?.categoryId || '') || 'Uncategorized';
      const entry = byItem.get(line.productId) || { productId: line.productId, name, categoryName, qty: 0, net: 0 };
      entry.qty += line.qty;
      entry.net += line.lineTotal;
      byItem.set(line.productId, entry);
    }
  }
  
  const sorted = Array.from(byItem.values()).sort((a, b) => b.net - a.net);
  return sorted.slice(0, params.top || 50);
}


export async function paymentMix(params: FilterParams) {
  const orders = await getFilteredOrders(params);
  const paymentsRepo = await safeReadJson<any[]>(path.join(dataDir, 'payments.json'), []);
  const orderIds = new Set(orders.map(o => o.id));
  const payments = paymentsRepo.filter(p => orderIds.has(p.orderId));
  
  const mix = new Map<string, { type: string; amount: number }>();
  let totalPayments = 0;

  for (const payment of payments) {
    const entry = mix.get(payment.type) || { type: payment.type, amount: 0 };
    entry.amount += payment.amount;
    mix.set(payment.type, entry);
    totalPayments += payment.amount;
  }

  return Array.from(mix.values()).map(item => ({
    ...item,
    sharePct: totalPayments > 0 ? (item.amount / totalPayments) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);
}


export async function registerClosures(params: FilterParams) {
    const allShifts = await safeReadJson<Shift[]>(path.join(dataDir, 'shifts.json'), []);
    const fromDate = params.from ? startOfDay(parseISO(params.from)) : null;
    const toDate = params.to ? endOfDay(parseISO(params.to)) : null;

    return allShifts.filter(shift => {
        if (shift.status !== 'closed' || !shift.tsClose) return false;
        const closeDate = parseISO(shift.tsClose);
        if (fromDate && closeDate < fromDate) return false;
        if (toDate && closeDate > toDate) return false;
        return true;
    }).map(s => ({
        shiftId: s.id,
        registerId: s.registerId,
        openedAt: s.tsOpen,
        closedAt: s.tsClose,
        expectedCash: s.cashExpected,
        countedCash: s.cashActual,
        discrepancy: (s.cashActual || 0) - (s.cashExpected || 0)
    })).sort((a,b) => b.closedAt!.localeCompare(a.closedAt!));
}
