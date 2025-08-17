
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SupplierItems } from '@/lib/repos/supplierItemsRepo';
import Papa from 'papaparse';

const schema = z.object({
  supplierId: z.string(),
  csv: z.string(),
});

export async function POST(req: Request) {
  const { supplierId, csv } = await req.json();

  try {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    
    const itemsToUpsert = parsed.data.map((row: any, i) => {
        if (!row.sku && !row.name) {
            throw new Error(`Row ${i+2}: SKU or Name is required.`);
        }
        return {
            id: `${supplierId}_${row.sku || row.name.replace(/\s+/g, '_')}`,
            supplierId,
            sku: row.sku,
            name: row.name,
            uom: row.uom,
            packSize: parseFloat(row.packSize),
            priceExVat: parseFloat(row.priceExVat),
            vatRate: row.vatRate ? parseFloat(row.vatRate) : undefined,
            lastUpdated: new Date().toISOString()
        };
    });

    await SupplierItems.upsertMany(itemsToUpsert);

    return NextResponse.json({ ok: true, count: itemsToUpsert.length });
  } catch (error) {
    return NextResponse.json({ message: 'CSV import failed', error: (error as Error).message }, { status: 400 });
  }
}
