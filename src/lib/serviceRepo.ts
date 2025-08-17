


import { promises as fs } from 'fs';
import path from 'path';
import { type ServiceCheck, type TableState, type User, type Order, type Table } from './data';
import * as ordersRepo from './ordersRepo';

const dataDir = path.join(process.cwd(), 'data');
const checksPath = path.join(dataDir, 'service_checks.json');

async function readChecks(): Promise<ServiceCheck[]> {
  try {
    await fs.access(checksPath);
    const data = await fs.readFile(checksPath, 'utf-8');
    return JSON.parse(data) as ServiceCheck[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(checksPath, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeChecks(data: ServiceCheck[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(checksPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function listOpen(): Promise<ServiceCheck[]> {
    const checks = await readChecks();
    return checks.filter(c => !c.closedAt);
}

export async function getCheck(id: string): Promise<ServiceCheck | null> {
    const checks = await readChecks();
    return checks.find(c => c.id === id) || null;
}

export async function getCheckByTable(tableId: string): Promise<ServiceCheck | null> {
    const checks = await listOpen();
    return checks.find(c => c.tableId === tableId) || null;
}

export async function saveCheck(checkToSave: ServiceCheck): Promise<void> {
    const checks = await readChecks();
    const index = checks.findIndex(c => c.id === checkToSave.id);
    if (index > -1) {
        checks[index] = checkToSave;
    } else {
        checks.unshift(checkToSave);
    }
    await writeChecks(checks);
}

export async function openCheck(
    table: Table, 
    server: { uid: string, name: string },
    guests: number,
    shiftId?: string
): Promise<ServiceCheck> {
    const existingCheck = await getCheckByTable(table.id);
    if (existingCheck) {
        throw new Error(`Table ${table.id} is already occupied.`);
    }

    const draftOrder = await ordersRepo.createDraft(server, { lines: [] }, shiftId);

    const newCheck: ServiceCheck = {
        id: `chk_${Date.now()}`,
        tableId: table.id,
        areaId: table.areaId,
        guests,
        server,
        openedAt: new Date().toISOString(),
        orderId: draftOrder.id,
        state: "seated",
        seats: table.seats,
        splits: [],
    };
    
    draftOrder.service = { type: 'dine_in', tableId: table.id, checkId: newCheck.id };
    await ordersRepo.saveOrder(draftOrder);

    await saveCheck(newCheck);
    return newCheck;
}

export async function setState(checkId: string, state: TableState): Promise<ServiceCheck> {
    const check = await getCheck(checkId);
    if (!check) throw new Error("Check not found");
    check.state = state;
    await saveCheck(check);
    return check;
}

export async function closeCheck(checkId: string): Promise<ServiceCheck> {
    const check = await getCheck(checkId);
    if (!check) throw new Error("Check not found");
    
    check.closedAt = new Date().toISOString();
    check.state = 'dirty'; // Table is now dirty
    
    // Also mark associated order as completed (if paid)
    const order = await ordersRepo.getOrder(check.orderId);
    if (order && order.status === 'PAID') {
        order.status = 'COMPLETED';
        await ordersRepo.saveOrder(order);
    }
    
    await saveCheck(check);
    return check;
}

export async function createSplit(checkId: string): Promise<ServiceCheck> {
    const check = await getCheck(checkId);
    if (!check) throw new Error("Check not found");

    const newSplitOrder = await ordersRepo.createOrderFromLines(
      await ordersRepo.getOrder(check.orderId) as Order,
      []
    );

    if (!check.splits) {
        check.splits = [];
    }

    const newSplit = {
        id: `spl_${Date.now()}`,
        name: `Check ${check.splits.length + 2}`,
        orderId: newSplitOrder.id,
    };

    check.splits.push(newSplit);
    await saveCheck(check);
    return check;
}

// Stubs for more complex operations
export async function splitCheck(checkId: string, parts: Array<{name?:string; lineIds:string[]}>) {
    console.warn("splitCheck is not fully implemented");
    return { splits: [] };
}

export async function mergeChecks(targetCheckId: string, sourceCheckIds: string[]) {
    console.warn("mergeChecks is not fully implemented");
    return getCheck(targetCheckId);
}

export async function transferCheck(checkId: string, toServer: {uid:string, name:string}) {
    console.warn("transferCheck is not fully implemented");
    return getCheck(checkId);
}
