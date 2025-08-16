'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type Shift, type User } from './data';
import * as cashRepo from './cashRepo';
import * as ordersRepo from './ordersRepo';

const dataDir = path.join(process.cwd(), 'data');
const shiftsPath = path.join(dataDir, 'shifts.json');
const sequencePath = path.join(dataDir, 'sequence.json');


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

async function nextShiftId(): Promise<string> {
    const seq = await readJSONFile(sequencePath, { order: 1001, shift: 1 });
    const nextId = seq.shift;
    await writeJSONFile(sequencePath, { ...seq, shift: nextId + 1 });
    return `shift_${nextId}`;
}


export async function getAllShifts(): Promise<Shift[]> {
    return readJSONFile<Shift[]>(shiftsPath, []);
}

export async function saveAllShifts(shifts: Shift[]): Promise<void> {
    await writeJSONFile(shiftsPath, shifts);
}

export async function getShift(id: string): Promise<Shift | null> {
    const shifts = await getAllShifts();
    return shifts.find(s => s.id === id) || null;
}

export async function getOpenShift(): Promise<Shift | null> {
    const shifts = await getAllShifts();
    return shifts.find(s => s.status === 'open') || null;
}

export async function saveShift(shiftToSave: Shift): Promise<Shift> {
    const shifts = await getAllShifts();
    const index = shifts.findIndex(s => s.id === shiftToSave.id);
    if (index > -1) {
        shifts[index] = shiftToSave;
    } else {
        shifts.unshift(shiftToSave);
    }
    await saveAllShifts(shifts);
    return shiftToSave;
}

export async function openShift(registerId: string, floatAmount: number, user: {id: string, name: string}): Promise<Shift> {
    const openShift = await getOpenShift();
    if (openShift) {
        throw new Error(`A shift is already open on register ${openShift.registerId}.`);
    }
    
    const newShift: Shift = {
        id: await nextShiftId(),
        registerId,
        userIdOpen: user.id,
        userNameOpen: user.name,
        tsOpen: new Date().toISOString(),
        floatAmount,
        status: 'open',
        cashPayments: 0,
        cardPayments: 0,
        cashExpected: floatAmount
    };

    return saveShift(newShift);
}

export async function closeShift(shiftId: string, cashActual: number, user: {id: string, name: string}): Promise<Shift> {
    const shift = await getShift(shiftId);
    if (!shift) throw new Error("Shift not found");
    if (shift.status === 'closed') throw new Error("Shift is already closed");

    const [cashMovements, orders] = await Promise.all([
        cashRepo.listMovementsByShift(shiftId),
        ordersRepo.listByShift(shiftId)
    ]);
    
    const cashIn = cashMovements.filter(m => m.type === 'payin').reduce((sum, m) => sum + m.amount, 0);
    const cashOut = cashMovements.filter(m => m.type === 'payout').reduce((sum, m) => sum + m.amount, 0);
    const cashSales = orders.flatMap(o => o.payments).filter(p => p.type === 'cash').reduce((sum, p) => sum + p.amount, 0);

    shift.cashExpected = shift.floatAmount + cashSales + cashIn - cashOut;
    
    shift.status = 'closed';
    shift.tsClose = new Date().toISOString();
    shift.userIdClose = user.id;
    shift.userNameClose = user.name;
    shift.cashActual = cashActual;
    shift.cashDifference = cashActual - shift.cashExpected;
    
    return saveShift(shift);
}
