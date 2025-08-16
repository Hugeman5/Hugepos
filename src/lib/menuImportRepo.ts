
'use server';
import { parseCsv, stringifyCsv } from './csv';
import * as catalog from './catalogRepo';
import { type Product, type Category } from './data';

type ItemCsvRow = {
  sku: string;
  name: string;
  category: string;
  price: string;
  tax_code: string;
  active: string;
  barcode: string;
  plu: string;
  modifier_groups: string;
  station_id: string;
  cost: string;
  cogs_group: string;
};

const CSV_COLUMNS: (keyof ItemCsvRow)[] = [
  'sku', 'name', 'category', 'price', 'tax_code', 'active', 'barcode', 'plu', 'modifier_groups', 'station_id', 'cost', 'cogs_group'
];

export async function importItemsCsv(csv: string): Promise<{ upserted: number; errors: string[] }> {
  const errors: string[] = [];
  let upserted = 0;
  
  const parsedRows: ItemCsvRow[] = parseCsv(csv, CSV_COLUMNS);

  const [products, categories] = await Promise.all([
    catalog.getProducts(),
    catalog.getCategories(),
  ]);
  const productMap = new Map(products.map(p => [p.id, p]));
  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
  const newCategories: Category[] = [];

  parsedRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-based index + header
    if (!row.sku || !row.name) {
      errors.push(`Row ${rowNum}: 'sku' and 'name' are required.`);
      return;
    }
    
    let categoryId = categoryMap.get(row.category?.toLowerCase());
    if (row.category && !categoryId) {
        const newCatId = row.category.toLowerCase().replace(/\s+/g, '_');
        if (!categoryMap.has(row.category.toLowerCase()) && !newCategories.find(c => c.id === newCatId)) {
            newCategories.push({ id: newCatId, name: row.category });
            categoryMap.set(row.category.toLowerCase(), newCatId);
        }
        categoryId = newCatId;
    }

    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Invalid 'price'. Must be a non-negative number.`);
        return;
    }

    const existing = productMap.get(row.sku);
    const product: Product = {
      ...existing,
      id: row.sku,
      name: row.name,
      price,
      categoryId: categoryId || existing?.categoryId || 'uncategorized',
      taxId: row.tax_code || existing?.taxId || 'vat15', // default tax
      active: row.active?.toLowerCase() === 'true',
      barcode: row.barcode,
      plu: row.plu,
      modifierIds: row.modifier_groups?.split(',').map(m => m.trim()).filter(Boolean) || existing?.modifierIds,
      stationId: row.station_id || existing?.stationId,
      cost: row.cost ? parseFloat(row.cost) : existing?.cost,
      cogsGroup: row.cogs_group || existing?.cogsGroup,
    };
    
    productMap.set(row.sku, product);
    upserted++;
  });

  if (errors.length > 0) {
    return { upserted: 0, errors };
  }

  await catalog.saveProducts(Array.from(productMap.values()));
  if (newCategories.length > 0) {
      await catalog.saveCategories([...categories, ...newCategories]);
  }

  return { upserted, errors };
}

export async function exportItemsCsv(): Promise<string> {
    const products = await catalog.getProducts();
    const categories = await catalog.getCategories();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const csvData = products.map(p => ({
        sku: p.id,
        name: p.name,
        category: categoryMap.get(p.categoryId) || p.categoryId,
        price: p.price,
        tax_code: p.taxId,
        active: p.active,
        barcode: p.barcode || '',
        plu: p.plu || '',
        modifier_groups: p.modifierIds?.join(',') || '',
        station_id: p.stationId || '',
        cost: p.cost || 0,
        cogs_group: p.cogsGroup || '',
    }));
    
    return stringifyCsv(csvData, CSV_COLUMNS);
}
