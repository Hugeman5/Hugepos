

import { promises as fs } from 'fs';
import path from 'path';
import { type FloorPlan, type Table, type Area, type Decor } from './data';

const dataDir = path.join(process.cwd(), 'data');
const floorPlanPath = path.join(dataDir, 'floor_plan.json');

const defaultFloorPlan: FloorPlan = {
  areas: [
    { id: "main", name: "Main Dining", color: "#6EE7B7", order: 1 }
  ],
  tables: [
    { id: "T1", areaId: "main", name: "T1", seats: 4, x: 100, y: 100, shape: "round" }
  ],
  decor: []
};

async function readFloorPlan(): Promise<FloorPlan> {
  try {
    await fs.access(floorPlanPath);
    const data = await fs.readFile(floorPlanPath, 'utf-8');
    const plan = JSON.parse(data) as FloorPlan;
    // Ensure decor array exists for backward compatibility
    if (!plan.decor) {
        plan.decor = [];
    }
    return plan;
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

export async function addArea(areaData: Omit<Area, 'id'>): Promise<Area> {
    const floor = await getFloor();
    const newArea: Area = {
        ...areaData,
        id: `area_${Date.now()}`
    };
    floor.areas.push(newArea);
    await saveFloor(floor);
    return newArea;
}

export async function updateArea(areaId: string, patch: Partial<Area>): Promise<Area> {
    const floor = await getFloor();
    const areaIndex = floor.areas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) {
        throw new Error(`Area ${areaId} not found.`);
    }
    const updatedArea = { ...floor.areas[areaIndex], ...patch };
    floor.areas[areaIndex] = updatedArea;
    await saveFloor(floor);
    return updatedArea;
}

export async function removeArea(areaId: string): Promise<void> {
    const floor = await getFloor();
    // Prevent deleting an area that still has tables
    if (floor.tables.some(t => t.areaId === areaId)) {
        throw new Error("Cannot delete area: it still contains tables.");
    }
    floor.areas = floor.areas.filter(a => a.id !== areaId);
    await saveFloor(floor);
}

// --- Decor CRUD ---
export async function addDecor(decorData: Omit<Decor, 'id'>): Promise<Decor> {
    const floor = await getFloor();
    const newDecor: Decor = {
        ...decorData,
        id: `decor_${Date.now()}`
    };
    if (!floor.decor) floor.decor = [];
    floor.decor.push(newDecor);
    await saveFloor(floor);
    return newDecor;
}

export async function updateDecor(decorId: string, patch: Partial<Decor>): Promise<Decor> {
    const floor = await getFloor();
    if (!floor.decor) throw new Error("No decor items exist to update.");
    const decorIndex = floor.decor.findIndex(d => d.id === decorId);
    if (decorIndex === -1) {
        throw new Error(`Decor item ${decorId} not found.`);
    }
    const updatedDecor = { ...floor.decor[decorIndex], ...patch };
    floor.decor[decorIndex] = updatedDecor;
    await saveFloor(floor);
    return updatedDecor;
}

export async function removeDecor(decorId: string): Promise<void> {
    const floor = await getFloor();
    if (!floor.decor) return;
    floor.decor = floor.decor.filter(d => d.id !== decorId);
    await saveFloor(floor);
}
