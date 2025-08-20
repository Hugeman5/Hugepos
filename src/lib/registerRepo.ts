
'use server';

import path from "path";
import { promises as fs } from "fs";

// --- TYPES ---
export type CashMove = { 
  id: string; 
  ts: string; 
  type: "in" | "out" | "pay" | "refund"; 
  amount: number; 
  reason?: string; 
  orderId?: string; 
};

export type RegisterShift = {
  id: string; 
  openedAt: string; 
  openedBy: string;
  closedAt?: string; 
  closedBy?: string; 
  notes?: string;
  openingFloat: number;
  cashMovements: CashMove[];
  paymentSummary: Record<string, number>;
  orderIds: string[];
};

export type RegisterFile = { 
  current?: RegisterShift | null; 
  history: RegisterShift[] 
};

// --- FILE OPS ---
const FILE_PATH = path.join(process.cwd(), "data", "register.json");
const defaultState: RegisterFile = { current: null, history: [] };

async function readRegisterFile(): Promise<RegisterFile> {
  try {
    await fs.access(FILE_PATH);
    const content = await fs.readFile(FILE_PATH, 'utf8');
    return JSON.parse(content || JSON.stringify(defaultState));
  } catch {
    await writeRegisterFile(defaultState);
    return defaultState;
  }
}

async function writeRegisterFile(data: RegisterFile): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// --- REPO API ---

export async function getRegister(): Promise<RegisterFile> {
  return await readRegisterFile();
}

export async function openShift(userId: string, openingFloat: number): Promise<RegisterShift> {
  const file = await readRegisterFile();
  if (file.current) {
    throw new Error("A shift is already open.");
  }

  const newShift: RegisterShift = {
    id: `shift_${Date.now()}`,
    openedAt: new Date().toISOString(),
    openedBy: userId,
    openingFloat,
    cashMovements: [],
    paymentSummary: { cash: 0, card: 0, eft: 0, other: 0 },
    orderIds: [],
  };

  file.current = newShift;
  await writeRegisterFile(file);
  return newShift;
}

export async function closeShift(userId: string, notes?: string): Promise<RegisterShift> {
  const file = await readRegisterFile();
  if (!file.current) {
    throw new Error("No shift is currently open.");
  }
  const shiftToClose = file.current;
  shiftToClose.closedAt = new Date().toISOString();
  shiftToClose.closedBy = userId;
  shiftToClose.notes = notes;
  
  file.history.unshift(shiftToClose);
  file.current = null;
  
  await writeRegisterFile(file);
  return shiftToClose;
}

export async function addCashMove(move: Omit<CashMove, "id" | "ts">): Promise<RegisterShift> {
  const file = await readRegisterFile();
  if (!file.current) {
    throw new Error("Cannot add cash movement: No shift is open.");
  }
  const newMove: CashMove = {
    ...move,
    id: `move_${Date.now()}`,
    ts: new Date().toISOString(),
  };
  file.current.cashMovements.push(newMove);
  await writeRegisterFile(file);
  return file.current;
}

export async function recordPayment(kind: "cash" | "card" | "eft" | "other", amount: number, orderId: string): Promise<void> {
  const file = await readRegisterFile();
  if (!file.current) {
    // No-op if no shift is open, as per instructions.
    console.warn(`Payment recorded for order ${orderId} but no shift is open. Payment not logged in register.`);
    return;
  }
  
  file.current.paymentSummary[kind] = (file.current.paymentSummary[kind] || 0) + amount;
  
  if (!file.current.orderIds.includes(orderId)) {
    file.current.orderIds.push(orderId);
  }
  
  await writeRegisterFile(file);
}
