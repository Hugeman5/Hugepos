
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type Station, type RoutingRules } from './data';

const dataDir = path.join(process.cwd(), 'data');
const stationsPath = path.join(dataDir, 'stations.json');
const routingPath = path.join(dataDir, 'routing.json');

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
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
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Stations ---

export async function getStations(): Promise<Station[]> {
  return readJSONFile<Station[]>(stationsPath, []);
}

export async function saveStations(stations: Station[]): Promise<void> {
  await writeJSONFile(stationsPath, stations);
}

// --- Routing ---

export async function getRouting(): Promise<RoutingRules> {
  const defaultRouting: RoutingRules = {
    defaultStation: 'kitchen_hot',
    byProduct: {},
    byCategory: {},
  };
  return readJSONFile<RoutingRules>(routingPath, defaultRouting);
}

export async function saveRouting(routing: RoutingRules): Promise<void> {
  await writeJSONFile(routingPath, routing);
}

export async function resolveStationForProduct(productId: string, categoryId?: string): Promise<string> {
  const rules = await getRouting();
  
  // 1. Check for a specific product override
  if (rules.byProduct && rules.byProduct[productId]) {
    return rules.byProduct[productId];
  }

  // 2. Check for a category default
  if (categoryId && rules.byCategory && rules.byCategory[categoryId]) {
    return rules.byCategory[categoryId];
  }

  // 3. Fallback to the system default
  return rules.defaultStation;
}
