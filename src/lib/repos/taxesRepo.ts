
import path from 'path';
import { promises as fs } from 'fs';

export type TaxRate = {
  id: string;
  name: string;
  rate: number;
  country: 'ZA';
};

const FILE_PATH = path.join(process.cwd(), 'data', 'taxes.json');

const defaultTaxes: TaxRate[] = [
    { id: 'za_vat_15', name: 'South Africa VAT 15%', rate: 0.15, country: 'ZA' }
];

async function read(): Promise<TaxRate[]> {
  try {
    await fs.access(FILE_PATH);
    const content = await fs.readFile(FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    await write(defaultTaxes);
    return defaultTaxes;
  }
}

async function write(data: TaxRate[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export const Taxes = {
  all: read,
  getDefaultVat: async (): Promise<TaxRate> => {
      const taxes = await read();
      return taxes.find(t => t.id === 'za_vat_15') || defaultTaxes[0];
  }
};
