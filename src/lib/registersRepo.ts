'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type Register } from './data';

const dataDir = path.join(process.cwd(), 'data');
const registersPath = path.join(dataDir, 'registers.json');

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

export async function getAllRegisters(): Promise<Register[]> {
  return readJSONFile<Register[]>(registersPath, []);
}

export async function saveAllRegisters(registers: Register[]): Promise<void> {
  await writeJSONFile(registersPath, registers);
}

export async function getRegister(id: string): Promise<Register | null> {
    const registers = await getAllRegisters();
    return registers.find(r => r.id === id) || null;
}
