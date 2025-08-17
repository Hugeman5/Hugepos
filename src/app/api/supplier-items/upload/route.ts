
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import Papa from 'papaparse';
import { SupplierItems } from '@/lib/repos/supplierItemsRepo';
import { upsertManyFromSupplierItems } from '@/lib/repos/ingredientsRepo';
import { getSettings } from '@/lib/settingsRepo';
import { Suppliers } from '@/lib/repos/suppliersRepo';
import { round2 } from '@/lib/money';

// Helper to normalize CSV headers
const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'description', 'itemdescription'],
  sku: ['sku', 'itemcode', 'code'],
  uom: ['uom', 'unitofmeasure'],
  packSize: ['packsize', 'pack'],
  priceExVat: ['priceexvat', 'exvat', 'unitprice'],
  priceIncVat: ['priceincvat', 'incvat', 'sellprice'],
};

// Find the first matching header in a row
const findHeader = (rowHeaders: string[], potentialNames: string[]): string | undefined => {
  for (const name of potentialNames) {
    const normalizedName = normalizeHeader(name);
    const found = rowHeaders.find(h => normalizeHeader(h) === normalizedName);
    if (found) return found;
  }
  return undefined;
};


export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const supplierId = formData.get('supplierId') as string;
    const defaultVatRateStr = formData.get('vatRate') as string;
    
    // User-provided column mappings
    const colName = formData.get('colName') as string | undefined;
    const colSku = formData.get('colSku') as string | undefined;
    const colUom = formData.get('colUom') as string | undefined;
    const colPackSize = formData.get('colPackSize') as string | undefined;
    const colPriceEx = formData.get('colPriceEx') as string | undefined;
    const colPriceInc = formData.get('colPriceInc') as string | undefined;


    if (!file) return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    if (!supplierId) return NextResponse.json({ message: 'Supplier ID is required.' }, { status: 400 });

    const supplier = await Suppliers.byId(supplierId);
    const appSettings = await getSettings();
    const vatRate = defaultVatRateStr ? parseFloat(defaultVatRateStr) : (supplier?.vatRate ?? appSettings.defaultVatRate);
    
    // Read file to string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvData = buffer.toString('utf-8');

    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields || [];

    const h = {
        name: colName || findHeader(headers, HEADER_MAPPINGS.name),
        sku: colSku || findHeader(headers, HEADER_MAPPINGS.sku),
        uom: colUom || findHeader(headers, HEADER_MAPPINGS.uom),
        packSize: colPackSize || findHeader(headers, HEADER_MAPPINGS.packSize),
        priceExVat: colPriceEx || findHeader(headers, HEADER_MAPPINGS.priceExVat),
        priceIncVat: colPriceInc || findHeader(headers, HEADER_MAPPINGS.priceIncVat),
    };

    if (!h.name) {
        return NextResponse.json({ message: "Could not find a 'Name' or 'Description' column in the CSV." }, { status: 400 });
    }
     if (!h.priceExVat && !h.priceIncVat) {
        return NextResponse.json({ message: "Could not find a Price column (e.g., 'Price ex VAT', 'Price inc VAT')." }, { status: 400 });
    }

    const itemsToUpsert = parsed.data.map((row: any) => {
      let priceExVat = parseFloat(row[h.priceExVat!]);
      let priceIncVat = parseFloat(row[h.priceIncVat!]);

      if (!isNaN(priceExVat) && isNaN(priceIncVat)) {
        priceIncVat = round2(priceExVat * (1 + vatRate));
      } else if (isNaN(priceExVat) && !isNaN(priceIncVat)) {
        priceExVat = round2(priceIncVat / (1 + vatRate));
      } else if (isNaN(priceExVat) && isNaN(priceIncVat)) {
        return null; // Skip rows without a valid price
      }
      
      const sku = h.sku ? row[h.sku] : undefined;
      const name = row[h.name!];

      return {
        id: `${supplierId}_${sku || name.toLowerCase().replace(/\s+/g, '_')}`,
        supplierId,
        sku,
        name,
        uom: h.uom ? row[h.uom] : 'ea',
        packSize: h.packSize ? parseFloat(row[h.packSize]) : 1,
        priceExVat,
        priceIncVat,
        vatRate,
        lastUpdated: new Date().toISOString(),
      };
    }).filter(Boolean);

    if (itemsToUpsert.length === 0) {
        return NextResponse.json({ message: "No valid items to import found in the file." }, { status: 400 });
    }
    
    // @ts-ignore - filter(Boolean) makes this safe
    await SupplierItems.upsertMany(itemsToUpsert);
    // @ts-ignore
    await upsertManyFromSupplierItems(supplierId, itemsToUpsert);

    return NextResponse.json({ imported: itemsToUpsert.length, supplierId });

  } catch (error) {
    console.error('CSV Upload Error:', error);
    return NextResponse.json({ message: 'An error occurred during file processing.', error: (error as Error).message }, { status: 500 });
  }
}
