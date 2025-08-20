
// src/lib/repos/registerRepo.ts
import { readJson, writeJsonAtomic, nowIso } from './io';
import { nextSeq } from '../sequence';

export type RegisterState = 'OPEN' | 'CLOSED';

export interface RegisterFile {
  state: RegisterState;
  currentShift: RegisterShift | null;
  history: RegisterShift[];
}

export interface RegisterShift {
  id: string;
  registerId: string;
  openedAt: string;
  openedBy: string;
  openedByName: string;
  openingFloat: number;
  movements: Array<{ id: string; type: 'IN'|'OUT'; amount: number; reason: string; at: string; by: string }>;
  payments: { cash: number; card: number; other: number };
  orders: Array<{ orderId: string; amount: number; method: 'CASH'|'CARD'|'OTHER'; paidAt: string }>;
  notes?: string;
  declaredCash: number | null;
  closedAt: string | null;
  closedBy: string | null;
  overShort: number | null;
}

const DEFAULT_REGISTER: RegisterFile = { state: 'CLOSED', currentShift: null, history: [] };

function newId(prefix: string) { return `${prefix}_${Date.now()}`; }

export async function getRegister(): Promise<RegisterFile> {
  return readJson<RegisterFile>('register.json', DEFAULT_REGISTER);
}

export async function openRegister(userId: string, userName: string, registerId: string, openingFloat: number, notes?: string) {
  const file = await getRegister();
  if (file.state === 'OPEN' && file.currentShift) {
    return { ok: false as const, status: 409, error: 'REGISTER_ALREADY_OPEN', register: file };
  }
  const shift: RegisterShift = {
    id: `rsh_${await nextSeq('shift')}`,
    registerId,
    openedAt: nowIso(),
    openedBy: userId,
    openedByName: userName,
    openingFloat,
    movements: [],
    payments: { cash: 0, card: 0, other: 0 },
    orders: [],
    notes,
    declaredCash: null,
    closedAt: null,
    closedBy: null,
    overShort: null
  };
  const next: RegisterFile = { state: 'OPEN', currentShift: shift, history: file.history };
  await writeJsonAtomic('register.json', next);
  return { ok: true as const, status: 200, shiftId: shift.id };
}

export async function moveCash(userId: string, type: 'IN'|'OUT', amount: number, reason: string) {
  const file = await getRegister();
  if (file.state !== 'OPEN' || !file.currentShift) {
    return { ok: false as const, status: 409, error: 'REGISTER_CLOSED' };
  }
  const mv = { id: newId('mv'), type, amount, reason, at: nowIso(), by: userId };
  file.currentShift.movements.push(mv);
  await writeJsonAtomic('register.json', file);
  return { ok: true as const };
}

export async function recordPayment(orderId: string, method: 'CASH'|'CARD'|'OTHER', amount: number, paidAt?: string) {
  const file = await getRegister();
  if (file.state !== 'OPEN' || !file.currentShift) {
    // This is a valid state if a transaction completes after a register is force-closed, for example.
    // We should not throw an error, but simply not record the payment against the closed shift.
    console.warn(`Payment for order ${orderId} received, but no register is open. Payment not logged against a shift.`);
    return { ok: true as const, warning: 'NO_OPEN_SHIFT' };
  }
  file.currentShift.orders.push({ orderId, amount, method, paidAt: paidAt || nowIso() });
  file.currentShift.payments[method.toLowerCase() as 'cash'|'card'|'other'] += amount;
  await writeJsonAtomic('register.json', file);
  return { ok: true as const };
}

export async function closeRegister(userId: string, declaredCash: number, notes?: string) {
  const file = await getRegister();
  if (file.state !== 'OPEN' || !file.currentShift) {
    return { ok: false as const, status: 409, error: 'REGISTER_ALREADY_CLOSED' };
  }
  const sh = file.currentShift;
  const expectedCash = sh.openingFloat
    + sh.movements.filter(m => m.type === 'IN').reduce((a, b) => a + b.amount, 0)
    - sh.movements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.amount, 0)
    + sh.payments.cash;
  const overShort = Number((declaredCash - expectedCash).toFixed(2));
  sh.declaredCash = declaredCash;
  sh.closedAt = nowIso();
  sh.closedBy = userId;
  sh.overShort = overShort;
  const next: RegisterFile = { state: 'CLOSED', currentShift: null, history: [sh, ...file.history] };
  await writeJsonAtomic('register.json', next);
  return { ok: true as const, overShort, zReport: sh };
}

export async function getRegisterStatus() {
  const file = await getRegister();
  const today = { totalCash: 0, totalCard: 0, movements: 0 };
  if (file.currentShift) {
    today.totalCash = file.currentShift.payments.cash;
    today.totalCard = file.currentShift.payments.card;
    today.movements = file.currentShift.movements.length;
  }
  return { state: file.state, currentShift: file.currentShift, today };
}
