
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { SupplierCatalog } from '@/lib/repos/supplierCatalogRepo';
import { Taxes } from '@/lib/repos/taxesRepo';
import { round2 } from '@/lib/money';

// Helper to normalize CSV headers for robust mapping
const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'description', 'itemdescription'],
  sku: ['sku', 'itemcode', 'code'],
  uom: ['uom', 'unitofmeasure'],
  packSize: ['packsize', 'pack', 'size'],
  priceExVat: ['priceexvat', 'exvat', 'unitprice', 'price'],
  priceIncVat: ['priceincvat', 'incvat', 'sellprice'],
};

// Find the first matching header in a row
const findHeader = (rowHeaders: string[], potentialNames: string[]): string | undefined => {
  const normalizedHeaders = rowHeaders.map(h => normalizeHeader(h));
  for (const name of potentialNames) {
    const normalizedName = normalizeHeader(name);
    const index = normalizedHeaders.indexOf(normalizedName);
    if (index !== -1) return rowHeaders[index];
  }
  return undefined;
};


export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const supplierId = params.id;
    
    // User-provided column mappings
    const colName = formData.get('colName') as string | undefined;
    const colSku = formData.get('colSku') as string | undefined;
    const colUom = formData.get('colUom') as string | undefined;
    const colPackSize = formData.get('colPackSize') as string | undefined;
    const colPriceEx = formData.get('colPriceEx') as string | undefined;
    const colPriceInc = formData.get('colPriceInc') as string | undefined;


    if (!file) return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    if (!supplierId) return NextResponse.json({ message: 'Supplier ID is required.' }, { status: 400 });

    const defaultVat = await Taxes.getDefaultVat();
    
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

    if (!h.name) return NextResponse.json({ message: "Could not find a 'Name' or 'Description' column." }, { status: 400 });
    if (!h.sku) return NextResponse.json({ message: "Could not find a 'SKU' or 'Code' column." }, { status: 400 });
    if (!h.priceExVat && !h.priceIncVat) return NextResponse.json({ message: "Could not find a Price column." }, { status: 400 });

    const itemsToUpsert = parsed.data.map((row: any) => {
      let priceExVat = h.priceExVat ? parseFloat(row[h.priceExVat]) : undefined;
      let priceIncVat = h.priceIncVat ? parseFloat(row[h.priceIncVat]) : undefined;

      if (priceExVat !== undefined && priceIncVat === undefined) {
        priceIncVat = round2(priceExVat * (1 + defaultVat.rate));
      } else if (priceExVat === undefined && priceIncVat !== undefined) {
        priceExVat = round2(priceIncVat / (1 + defaultVat.rate));
      } else if (priceExVat === undefined && priceIncVat === undefined) {
        return null; // Skip rows without a valid price
      }
      
      const name = row[h.name!];
      const sku = row[h.sku!];
      if (!name || !sku) return null;

      return {
        sku,
        name,
        purchaseUom: h.uom ? row[h.uom] : 'ea',
        purchaseSize: h.packSize ? parseFloat(row[h.packSize]) : 1,
        priceExVat,
        priceIncVat,
        vatRate: defaultVat.rate,
        lastUpdated: new Date().toISOString(),
      };
    }).filter(Boolean);

    // @ts-ignore
    await SupplierCatalog.upsertItems(supplierId, itemsToUpsert);

    return NextResponse.json({ imported: itemsToUpsert.length, supplierId });

  } catch (error) {
    console.error('CSV Upload Error:', error);
    return NextResponse.json({ message: 'An error occurred during file processing.', error: (error as Error).message }, { status: 500 });
  }
}
