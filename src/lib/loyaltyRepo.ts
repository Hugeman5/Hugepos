
import { promises as fs } from 'fs';
import path from 'path';
import { type LoyaltyRules, type LedgerEntry } from './data';
import * as customersRepo from './customersRepo';

const dataDir = path.join(process.cwd(), 'data');
const rulesPath = path.join(dataDir, 'loyalty_rules.json');
const txnsPath = path.join(dataDir, 'loyalty_txns.json');

const defaultRules: LoyaltyRules = {
  earn: { pointsPerCurrency: 1 },
  redeem: { pointsPerCurrency: 20 },
  maxRedeemPct: 50,
  autoEnroll: true,
};

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getRules(): Promise<LoyaltyRules> {
  return readJSONFile<LoyaltyRules>(rulesPath, defaultRules);
}

export async function saveRules(rules: LoyaltyRules): Promise<void> {
  await writeJSONFile(rulesPath, rules);
}

async function getLedgerAll(): Promise<LedgerEntry[]> {
    return readJSONFile<LedgerEntry[]>(txnsPath, []);
}

export async function getLedger(customerId: string, limit = 100): Promise<LedgerEntry[]> {
    const all = await getLedgerAll();
    return all.filter(txn => txn.customerId === customerId).slice(0, limit);
}

async function postTransaction(
    txnData: Omit<LedgerEntry, 'id' | 'ts'>
): Promise<LedgerEntry> {
    const all = await getLedgerAll();
    const newTxn: LedgerEntry = {
        ...txnData,
        id: `ltxn_${Date.now()}`,
        ts: new Date().toISOString(),
    };
    all.unshift(newTxn);
    await writeJSONFile(txnsPath, all);
    await customersRepo.incrementPoints(txnData.customerId, txnData.points);
    return newTxn;
}

export async function postAccrual(data: {
  customerId: string;
  orderId: string;
  amount: number;
  points: number;
}): Promise<LedgerEntry> {
  return postTransaction({
    ...data,
    type: 'earn',
    note: `Earned from order #${data.orderId}`,
  });
}

export async function postRedemption(data: {
  customerId: string;
  orderId: string;
  points: number; // should be negative
  value: number; // redeemed value
}): Promise<LedgerEntry> {
    if (data.points > 0) {
        throw new Error("Redemption points must be negative.");
    }
  return postTransaction({
    ...data,
    type: 'redeem',
    note: `Redeemed on order #${data.orderId}`,
  });
}
