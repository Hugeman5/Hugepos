'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type FloorPlan, type Table } from './data';

const dataDir = path.join(process.cwd(), 'data');
const floorPlanPath = path.join(dataDir, 'floor_plan.json');

const defaultFloorPlan: FloorPlan = {
  areas: [
    { id: "main", name: "Main Dining", color: "#6EE7B7", order: 1 }
  ],
  tables: [
    { id: "T1", areaId: "main", name: "T1", seats: 4, x: 100, y: 100, shape: "round" }
  ]
};

async function readFloorPlan(): Promise<FloorPlan> {
  try {
    await fs.access(floorPlanPath);
    const data = await fs.readFile(floorPlanPath, 'utf-8');
    return JSON.parse(data) as FloorPlan;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeFloorPlan(defaultFloorPlan);
      return defaultFloorPlan;
    }
    throw error;
  }
}

async function writeFloorPlan(data: FloorPlan): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(floorPlanPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getFloor(): Promise<FloorPlan> {
  return await readFloorPlan();
}

export async function saveFloor(floorPlan: FloorPlan): Promise<void> {
  await writeFloorPlan(floorPlan);
}

export async function addTable(tableData: Omit<Table, 'id'>): Promise<Table> {
    const floor = await getFloor();
    const newTable: Table = {
        ...tableData,
        id: `T${Date.now()}`
    };
    floor.tables.push(newTable);
    await saveFloor(floor);
    return newTable;
}

export async function updateTable(tableId: string, patch: Partial<Table>): Promise<Table> {
    const floor = await getFloor();
    const tableIndex = floor.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
        throw new Error(`Table ${tableId} not found.`);
    }
    const updatedTable = { ...floor.tables[tableIndex], ...patch };
    floor.tables[tableIndex] = updatedTable;
    await saveFloor(floor);
    return updatedTable;
}

export async function removeTable(tableId: string): Promise<void> {
    const floor = await getFloor();
    floor.tables = floor.tables.filter(t => t.id !== tableId);
    await saveFloor(floor);
}
