
import path from "path";
import { promises as fs } from "fs";

export type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatRate?: number;   // default from settings if missing
  notes?: string;
};

const FILE = path.join(process.cwd(), "data", "suppliers.json");

async function read(): Promise<Supplier[]> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return []; }
}
async function write(rows: Supplier[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}
export const Suppliers = {
  all: read,
  byId: async (id: string) => (await read()).find(s => s.id === id) || null,
  upsert: async (s: Supplier) => {
    const rows = await read();
    const i = rows.findIndex(x => x.id === s.id);
    if (i >= 0) rows[i] = s; else rows.push(s);
    await write(rows);
    return s;
  },
  remove: async (id: string) => {
    const rows = await read();
    await write(rows.filter(x => x.id !== id));
  }
};
