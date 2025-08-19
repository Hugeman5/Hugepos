
import path from 'path';
import { promises as fs } from 'fs';

export type Account = {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
};

const FILE_PATH = path.join(process.cwd(), 'data', 'accounts.json');

const defaultAccounts: Account[] = [
  { id: 'asset_inv_food', code: '1400', name: 'Inventory - Food', type: 'asset' },
  { id: 'asset_inv_bev', code: '1410', name: 'Inventory - Beverage', type: 'asset' },
  { id: 'asset_inv_nonfood', code: '1420', name: 'Inventory - Non-food', type: 'asset' },
  { id: 'exp_cogs_food', code: '5000', name: 'COGS - Food', type: 'expense' },
  { id: 'exp_cogs_bev', code: '5010', name: 'COGS - Beverage', type: 'expense' },
  { id: 'exp_cogs_nonfood', code: '5020', name: 'COGS - Non-food', type: 'expense' },
  { id: 'liab_vat', code: '2200', name: 'VAT Payable', type: 'liability' },
  { id: 'rev_sales_food', code: '4000', name: 'Sales - Food', type: 'revenue' },
  { id: 'rev_sales_bev', code: '4010', name: 'Sales - Beverage', type: 'revenue' },
];

async function read(): Promise<Account[]> {
  try {
    await fs.access(FILE_PATH);
    const content = await fs.readFile(FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    await write(defaultAccounts);
    return defaultAccounts;
  }
}

async function write(data: Account[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export const Accounts = {
  all: read,
  suggestForCategory(categoryId: string) {
    // Basic stub implementation
    if (categoryId.includes('bev')) {
      return { inventory: 'asset_inv_bev', cogs: 'exp_cogs_bev', sales: 'rev_sales_bev' };
    }
    return { inventory: 'asset_inv_food', cogs: 'exp_cogs_food', sales: 'rev_sales_food' };
  }
};
