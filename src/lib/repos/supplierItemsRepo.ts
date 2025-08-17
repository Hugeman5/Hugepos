
import path from "path";
import { promises as fs } from "fs";

export type SupplierItem = {
  id: string;
  supplierId: string;
  sku?: string;
  name: string;
  uom: string;
  packSize: number;
  priceExVat: number;
  vatRate?: number;
  lastUpdated?: string;
};

const FILE = path.join(process.cwd(), "data", "supplierItems.json");

async function read(): Promise<SupplierItem[]> { try { return JSON.parse(await fs.readFile(FILE,"utf8")); } catch { return []; } }
async function write(rows: SupplierItem[]){ await fs.mkdir(path.dirname(FILE),{recursive:true}); await fs.writeFile(FILE, JSON.stringify(rows,null,2)); }

export const SupplierItems = {
  forSupplier: async (supplierId: string) => (await read()).filter(i => i.supplierId === supplierId),
  upsertMany: async (items: SupplierItem[]) => {
    const rows = await read();
    const map = new Map(rows.map(r => [r.id, r]));
    items.forEach(it => map.set(it.id, it));
    await write([...map.values()]);
  },
  upsert: async (item: SupplierItem) => {
    const rows = await read();
    const i = rows.findIndex(x => x.id === item.id);
    if (i >= 0) rows[i] = item; else rows.push(item);
    await write(rows);
    return item;
  }
};
