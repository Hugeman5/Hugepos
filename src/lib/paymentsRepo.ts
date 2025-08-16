
import { promises as fs } from 'fs';
import path from 'path';
import { type Payment } from './data';

const paymentsPath = path.join(process.cwd(), 'data', 'payments.json');

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function appendPayment(p: Omit<Payment, 'id' | 'ts'>): Promise<Payment> {
    const payments = await readJSONFile<Payment[]>(paymentsPath, []);
    const newPayment: Payment = {
        ...p,
        id: `pay_${Date.now()}`,
        ts: new Date().toISOString(),
    };
    payments.unshift(newPayment);
    await writeJSONFile(paymentsPath, payments);
    return newPayment;
}

export async function listByOrder(orderId: string): Promise<Payment[]> {
    const allPayments = await readJSONFile<Payment[]>(paymentsPath, []);
    return allPayments.filter(p => p.orderId === orderId);
}
