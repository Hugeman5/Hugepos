
import path from "path";
import { promises as fs } from "fs";

export type PurchaseLine = {
  sku?: string;
  description: string;
  qty: number;
  uom: 'g'|'kg'|'ml'|'l'|'ea';
  packSize: number;
  unitPriceExVat: number;
  unitPriceIncVat: number;
  vatRate: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  lines: PurchaseLine[];
  totals: { ex: number; vat: number; inc: number };
  notes?: string;
};

const FILE = path.join(process.cwd(), "data", "purchases.json");

async function read(): Promise<PurchaseOrder[]> { try { return JSON.parse(await fs.readFile(FILE,"utf8")); } catch { return []; } }
async function write(rows: PurchaseOrder[]){ await fs.mkdir(path.dirname(FILE),{recursive:true}); await fs.writeFile(FILE, JSON.stringify(rows,null,2)); }

export const POs = {
  all: read,
  byId: async (id: string) => (await read()).find(p => p.id === id) || null,
  create: async (po: PurchaseOrder) => { const rows = await read(); rows.unshift(po); await write(rows); return po; },
  update: async (po: PurchaseOrder) => { const rows = await read(); const i = rows.findIndex(x => x.id === po.id); if (i>=0) rows[i]=po; await write(rows); return po; }
};
