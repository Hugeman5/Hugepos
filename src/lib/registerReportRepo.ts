

import { promises as fs } from 'fs';
import path from 'path';
import { type RegisterReport, type Shift, type Payment } from './data';
import * as cashRepo from './cashRepo';
import * as ordersRepo from './ordersRepo';
import * as paymentsRepo from './paymentsRepo';

const dataDir = path.join(process.cwd(), 'data');
const reportsPath = path.join(dataDir, 'register_reports.json');

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getReport(reportId: string): Promise<RegisterReport | null> {
  const reports = await readJSONFile<RegisterReport[]>(reportsPath, []);
  return reports.find(r => r.id === reportId) || null;
}

export async function generateAndSaveReport(shift: Shift, actualCash: number): Promise<RegisterReport> {
  if (shift.status !== 'closed') {
    throw new Error("Cannot generate report for a shift that is not closed.");
  }

  const [orders, cashMovements] = await Promise.all([
    ordersRepo.listByShift(shift.id),
    cashRepo.listMovementsByShift(shift.id),
  ]);
  
  const allPayments = (await Promise.all(orders.map(o => paymentsRepo.listByOrder(o.id)))).flat();
  
  const salesTotal = orders.reduce((sum, order) => sum + order.totals.total, 0);
  const taxTotal = orders.reduce((sum, order) => sum + order.totals.tax, 0);
  const netSales = salesTotal - taxTotal;
  
  const cashPaymentsTotal = allPayments.filter(p => p.type === 'cash').reduce((sum, p) => sum + p.amount, 0);
  const cardPaymentsTotal = allPayments.filter(p => p.type === 'card').reduce((sum, p) => sum + p.amount, 0);
  const giftCardPaymentsTotal = allPayments.filter(p => p.type === 'gift_card').reduce((sum, p) => sum + p.amount, 0);


  const cashIn = cashMovements.filter(m => m.type === 'payin').reduce((sum, m) => sum + m.amount, 0);
  const cashOut = cashMovements.filter(m => m.type === 'payout').reduce((sum, m) => sum + m.amount, 0);

  const expectedInDrawer = shift.floatAmount + cashPaymentsTotal + cashIn - cashOut;
  const difference = actualCash - expectedInDrawer;

  const report: RegisterReport = {
    id: `report_${shift.id}`,
    shiftId: shift.id,
    ts: new Date().toISOString(),
    salesTotal,
    taxTotal,
    netSales,
    cashPaymentsTotal,
    cardPaymentsTotal,
    giftCardPaymentsTotal,
    startingFloat: shift.floatAmount,
    cashIn,
    cashOut,
    cashSales: cashPaymentsTotal, // same as cashPaymentsTotal
    expectedInDrawer,
    actualInDrawer: actualCash,
    difference,
    orders: orders.map(o => o.number),
    payments: allPayments,
    cashMovements,
  };

  const reports = await readJSONFile<RegisterReport[]>(reportsPath, []);
  reports.unshift(report);
  await writeJSONFile(reportsPath, reports);

  return report;
}
