
import path from "path";
import { promises as fs } from "fs";
import { round2 } from "@/lib/money";

export type OrderLine = { 
  id:string;
  itemId: string;
  name: string;
  qty: number;
  unitExVat: number;
  lineExVat: number;
  taxRate: number;
  tax: number;
  lineIncVat: number;
  currency: string;
  choices?: Record<string, { id: string; qty?: number }[]>;
  station?: string; // e.g. "kitchen"
  state?: "queued"|"preparing"|"ready"|"bumped";
};

export type Order = {
  id: string;
  tableId?: string;
  status: "open" | "sent" | "closed";
  lines: OrderLine[];
  totals: { exVat: number; tax: number; incVat: number; currency: string };
  ticketNo?: number;
  createdAt: number;
  updatedAt: number;
};

const FILE = path.join(process.cwd(), "data", "orders.json");

async function readAll(): Promise<Order[]> {
  try { 
    await fs.access(FILE);
    return JSON.parse(await fs.readFile(FILE, "utf8")); 
  } catch { return []; }
}
async function writeAll(orders: Order[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(orders, null, 2), "utf8");
}
export { readAll, writeAll };

function recalc(order: Order) {
  let ex = 0, tax = 0, inc = 0;
  const currency = order.lines[0]?.currency || "ZAR";
  for (const l of order.lines) { ex += l.lineExVat; tax += l.tax; inc += l.lineIncVat; }
  order.totals = { exVat: round2(ex), tax: round2(tax), incVat: round2(inc), currency };
  order.updatedAt = Date.now();
  return order;
}

function newId(prefix="o_") { return prefix + Math.random().toString(36).slice(2,10); }

export async function getOpenOrCreate({ tableId }: { tableId: string }): Promise<Order> {
  const all = await readAll();
  let o = all.find(x => x.tableId === tableId && x.status === "open");
  if (!o) {
    o = { id: newId(), tableId, status: "open", lines: [], totals: { exVat:0, tax:0, incVat:0, currency:"ZAR" }, createdAt: Date.now(), updatedAt: Date.now() };
    all.push(o);
    await writeAll(all);
  }
  return o;
}

export async function addLineToOrder({ orderId, tableId, line }: { orderId?: string; tableId?: string; line: OrderLine }) {
  const all = await readAll();
  let o = orderId ? all.find(x => x.id === orderId) : undefined;
  if (!o && tableId) o = all.find(x => x.tableId === tableId && x.status === "open");
  if (!o) {
    o = { id: newId(), tableId, status: "open", lines: [], totals: { exVat:0, tax:0, incVat:0, currency: line.currency }, createdAt: Date.now(), updatedAt: Date.now() };
    all.push(o);
  }
  
  o.lines.push(line);
  recalc(o);
  await writeAll(all);
  return o;
}

export async function updateLineQty({ orderId, lineId, qty, recompute }: {
  orderId: string; lineId: string; qty: number; recompute: (old: OrderLine) => OrderLine;
}) {
  const all = await readAll();
  const o = all.find(x => x.id === orderId);
  if (!o) throw new Error("Order not found");
  const idx = o.lines.findIndex(l => l.id === lineId);
  if (idx === -1) throw new Error("Line not found");

  if (qty <= 0) {
    o.lines.splice(idx, 1);
  } else {
    const old = o.lines[idx];
    const fresh = recompute(old);
    o.lines[idx] = { ...fresh };
  }

  recalc(o);
  await writeAll(all);
  return o;
}

export async function sendOrder({ orderId, tableId, routeFor }: {
  orderId?: string; tableId?: string; routeFor: (l: OrderLine) => string;
}) {
  const all = await readAll();
  let o = orderId
    ? all.find(x => x.id === orderId)
    : undefined;
  if (!o && tableId) {
    o = all.find(x => x.tableId === tableId && x.status === "open");
  }

  if (!o) throw new Error("Order not found");

  o.status = "sent";
  for (const l of o.lines) {
    if (l.state === "queued") { // Only update unsent items
        l.station = routeFor(l);
    }
  }
  recalc(o);
  await writeAll(all);
  return o;
}
