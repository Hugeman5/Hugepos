
import { promises as fs } from 'fs';
import path from 'path';
import { type KdsTicket } from './data';

const dataDir = path.join(process.cwd(), 'data');
const queuePath = path.join(dataDir, 'kds', 'queue.json');

async function readQueue(): Promise<KdsTicket[]> {
  try {
    await fs.access(queuePath);
    const data = await fs.readFile(queuePath, 'utf-8');
    return JSON.parse(data) as KdsTicket[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(path.dirname(queuePath), { recursive: true });
      await fs.writeFile(queuePath, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeQueue(tickets: KdsTicket[]): Promise<void> {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  await fs.writeFile(queuePath, JSON.stringify(tickets, null, 2), 'utf-8');
}

export async function getTickets(filters: {
  station?: string;
  status?: 'active' | 'done';
}): Promise<KdsTicket[]> {
  let tickets = await readQueue();
  
  if (filters.station) {
    tickets = tickets.filter(t => t.station === filters.station);
  }
  
  if (filters.status === 'active') {
    tickets = tickets.filter(t => t.status === 'queued');
  } else if (filters.status === 'done') {
    // Return recent done tickets, sorted newest first
    tickets = tickets
      .filter(t => t.status === 'done')
      .sort((a,b) => new Date(b.doneAt!).getTime() - new Date(a.doneAt!).getTime())
      .slice(0, 20); // Limit to last 20 done tickets
  }

  return tickets;
}

export async function addTicket(ticketData: Omit<KdsTicket, 'id' | 'createdAt' | 'status' | 'expedite'>): Promise<KdsTicket> {
  const queue = await readQueue();
  const newTicket: KdsTicket = {
    ...ticketData,
    id: `kds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'queued',
    expedite: false,
  };
  queue.push(newTicket);
  await writeQueue(queue);
  return newTicket;
}

async function updateTicket(ticketId: string, patch: Partial<KdsTicket>): Promise<KdsTicket> {
  const queue = await readQueue();
  const index = queue.findIndex(t => t.id === ticketId);
  if (index === -1) {
    throw new Error(`Ticket with ID ${ticketId} not found.`);
  }
  const updatedTicket = { ...queue[index], ...patch };
  queue[index] = updatedTicket;
  await writeQueue(queue);
  return updatedTicket;
}

export async function bumpTicket(ticketId: string): Promise<KdsTicket> {
  return updateTicket(ticketId, { status: 'done', doneAt: new Date().toISOString() });
}

export async function undoTicket(ticketId: string): Promise<KdsTicket> {
    return updateTicket(ticketId, { status: 'queued', doneAt: undefined });
}

export async function expediteTicket(ticketId: string, expedite: boolean): Promise<KdsTicket> {
  return updateTicket(ticketId, { expedite });
}
