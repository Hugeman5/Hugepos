'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type CashMovement } from './data';

const dataDir = path.join(process.cwd(), 'data');
const cashMovesPath = path.join(dataDir, 'cash_movements.json');

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

export async function listMovementsByShift(shiftId: string): Promise<CashMovement[]> {
  const allMoves = await readJSONFile<CashMovement[]>(cashMovesPath, []);
  return allMoves.filter(m => m.shiftId === shiftId);
}

export async function addMovement(
  data: Omit<CashMovement, 'id' | 'ts'>
): Promise<CashMovement> {
  const allMoves = await readJSONFile<CashMovement[]>(cashMovesPath, []);
  const newMovement: CashMovement = {
    ...data,
    id: `cash_${Date.now()}`,
    ts: new Date().toISOString(),
  };
  allMoves.unshift(newMovement);
  await writeJSONFile(cashMovesPath, allMoves);
  return newMovement;
}
