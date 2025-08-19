
import path from "path";
import { promises as fs } from "fs";
import { round2 } from "@/lib/money";
import { nextSeq } from "@/lib/sequence";

export type OrderLine = {
  id: string;
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
  station?: string;
  state?: "queued" | "preparing" | "ready" | "bumped";
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

function uid() {
  return "o_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function readAll(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}
export async function writeAll(data: Order[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

function recalc(order: Order): Order {
  const ex = round2(order.lines.reduce((s, l) => s + l.lineExVat, 0));
  const tax = round2(order.lines.reduce((s, l) => s + l.tax, 0));
  const inc = round2(ex + tax);
  const currency = order.lines[0]?.currency || "ZAR";
  order.totals = { exVat: ex, tax, incVat: inc, currency };
  order.updatedAt = Date.now();
  return order;
}

export async function addLineToOrder({
  orderId,
  tableId,
  line,
}: {
  orderId?: string;
  tableId?: string;
  line: OrderLine;
}) {
  const all = await readAll();

  let order: Order | undefined;
  if (orderId) {
    order = all.find(o => o.id === orderId);
  }
  if (!order && tableId) {
    order = all.find(o => o.tableId === tableId && o.status === "open");
  }
  if (!order) {
    order = {
      id: uid(),
      tableId,
      status: "open",
      lines: [],
      totals: { exVat: 0, tax: 0, incVat: 0, currency: line.currency },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all.push(order);
  }

  order.lines.push(line);
  recalc(order);
  await writeAll(all);
  return order;
}

export async function updateLineQty({ orderId, lineId, qty, recompute }: {
    orderId:string; lineId:string; qty:number; recompute:(oldLine:OrderLine)=>OrderLine
}): Promise<Order> {
    const all = await readAll();
    const order = all.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const lineIndex = order.lines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) throw new Error("Line not found");

    if (qty <= 0) {
        order.lines.splice(lineIndex, 1);
    } else {
        const oldLine = order.lines[lineIndex];
        const freshLine = recompute(oldLine);
        order.lines[lineIndex] = freshLine;
    }
    
    recalc(order);
    await writeAll(all);
    return order;
}

export async function sendOrder({ orderId, tableId, routeFor }: {
  orderId?:string; tableId?:string; routeFor:(line:OrderLine)=>string
}): Promise<Order> {
    const all = await readAll();
    let order: Order | undefined;
    if (orderId) {
      order = all.find(o => o.id === orderId);
    }
    if (!order && tableId) {
      order = all.find(o => o.tableId === tableId && o.status === "open");
    }
    if (!order) throw new Error("Could not find open order to send");

    order.status = "sent";
    order.ticketNo = await nextSeq('ticket');
    order.lines.forEach(l => {
        l.station = routeFor(l);
        l.state = "queued";
    });
    recalc(order);
    await writeAll(all);
    return order;
}

export async function getOpenOrCreate({ tableId }: { tableId: string }): Promise<Order> {
    const all = await readAll();
    let order = all.find(o => o.tableId === tableId && o.status === "open");
    if (!order) {
        order = {
            id: uid(),
            tableId,
            status: "open",
            lines: [],
            totals: { exVat: 0, tax: 0, incVat: 0, currency: "ZAR" },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        all.push(order);
        await writeAll(all);
    }
    return order;
}
