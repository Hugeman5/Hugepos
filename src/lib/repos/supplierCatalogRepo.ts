
import path from 'path';
import { promises as fs } from 'fs';
import { normalizeUom } from '../uom';
import { round2 } from '../money';
import { Taxes } from './taxesRepo';

export type SupplierCatalogItem = {
  sku: string;
  name: string;
  purchaseUom: "g" | "kg" | "ml" | "l" | "ea";
  purchaseSize: number;
  priceExVat?: number;
  priceIncVat: number;
  vatRate?: number;
  lastUpdated: string;
  ingredientId?: string;
};

export type SupplierCatalog = {
  supplierId: string;
  items: SupplierCatalogItem[];
};

const CATALOGS_DIR = path.join(process.cwd(), 'data', 'supplier_catalogs');
const INDEX_FILE = path.join(CATALOGS_DIR, 'index.json');

async function getCatalogPath(supplierId: string): Promise<string> {
    await fs.mkdir(CATALOGS_DIR, { recursive: true });
    return path.join(CATALOGS_DIR, `${supplierId}.json`);
}

async function getIndex(): Promise<{ suppliers: string[] }> {
    try {
        await fs.access(INDEX_FILE);
        return JSON.parse(await fs.readFile(INDEX_FILE, 'utf8'));
    } catch {
        return { suppliers: [] };
    }
}

async function writeIndex(index: { suppliers: string[] }): Promise<void> {
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

export const SupplierCatalog = {
  async getCatalog(supplierId: string): Promise<SupplierCatalog> {
    const filePath = await getCatalogPath(supplierId);
    try {
      await fs.access(filePath);
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch {
      return { supplierId, items: [] };
    }
  },

  async saveCatalog(supplierId: string, catalog: SupplierCatalog): Promise<void> {
    const filePath = await getCatalogPath(supplierId);
    const index = await getIndex();
    if (!index.suppliers.includes(supplierId)) {
        index.suppliers.push(supplierId);
        await writeIndex(index);
    }
    await fs.writeFile(filePath, JSON.stringify(catalog, null, 2), 'utf8');
  },

  async upsertItems(supplierId: string, items: SupplierCatalogItem[]): Promise<void> {
    const catalog = await this.getCatalog(supplierId);
    const itemMap = new Map(catalog.items.map(i => [i.sku, i]));
    const defaultVat = await Taxes.getDefaultVat();

    for (const item of items) {
        // Validation and normalization
        item.purchaseUom = normalizeUom(item.purchaseUom);
        item.purchaseSize = Number(item.purchaseSize) > 0 ? Number(item.purchaseSize) : 1;
        
        let priceEx = item.priceExVat ? Number(item.priceExVat) : undefined;
        let priceInc = item.priceIncVat ? Number(item.priceIncVat) : undefined;
        let vatRate = item.vatRate ? Number(item.vatRate) : defaultVat.rate;

        if (priceEx !== undefined && priceInc === undefined) {
            priceInc = round2(priceEx * (1 + vatRate));
        } else if (priceEx === undefined && priceInc !== undefined) {
            priceEx = round2(priceInc / (1 + vatRate));
        } else if (priceEx === undefined && priceInc === undefined) {
            continue; // Skip items without any price
        }
        
        item.priceExVat = priceEx;
        item.priceIncVat = priceInc!;
        item.vatRate = vatRate;
        
        itemMap.set(item.sku, item);
    }
    
    catalog.items = Array.from(itemMap.values());
    await this.saveCatalog(supplierId, catalog);
  }
};
