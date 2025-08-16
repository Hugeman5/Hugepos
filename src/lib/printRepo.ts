
import { promises as fs } from 'fs';
import path from 'path';
import { type PrintJob } from './data';

const dataDir = path.join(process.cwd(), 'data');
const queuePath = path.join(dataDir, 'print_queue.json');
const spoolPath = path.join(dataDir, 'prints');

async function readQueue(): Promise<PrintJob[]> {
  try {
    await fs.access(queuePath);
    const data = await fs.readFile(queuePath, 'utf-8');
    return JSON.parse(data) as PrintJob[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(queuePath, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeQueue(jobs: PrintJob[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(queuePath, JSON.stringify(jobs, null, 2), 'utf-8');
}

export async function ensureSpoolDir(): Promise<void> {
    await fs.mkdir(spoolPath, { recursive: true });
}

export async function enqueue(jobData: Omit<PrintJob, 'id' | 'ts' | 'status'>): Promise<PrintJob> {
    const queue = await readQueue();
    const newJob: PrintJob = {
        ...jobData,
        id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ts: new Date().toISOString(),
        status: 'queued',
    };
    queue.unshift(newJob);
    await writeQueue(queue);
    return newJob;
}

export async function getJob(jobId: string): Promise<PrintJob | null> {
    const queue = await readQueue();
    return queue.find(j => j.id === jobId) || null;
}

export async function setStatus(jobId: string, status: PrintJob['status'], patch?: Partial<PrintJob>): Promise<PrintJob> {
    const queue = await readQueue();
    const jobIndex = queue.findIndex(j => j.id === jobId);
    if (jobIndex === -1) {
        throw new Error(`Job ${jobId} not found.`);
    }
    queue[jobIndex] = { ...queue[jobIndex], ...patch, status };
    await writeQueue(queue);
    return queue[jobIndex];
}

export async function listQueue(filters: { status?: PrintJob['status'] } = {}): Promise<PrintJob[]> {
    let queue = await readQueue();
    if (filters.status) {
        queue = queue.filter(j => j.status === filters.status);
    }
    return queue;
}

export async function clearQueue(all: boolean = false): Promise<void> {
    if (all) {
        await writeQueue([]);
        // Optional: clear spool directory
    } else {
        // Clear only completed jobs older than a day
        const queue = await readQueue();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const filteredQueue = queue.filter(j => 
            j.status !== 'rendered' || (now - new Date(j.ts).getTime() < oneDay)
        );
        await writeQueue(filteredQueue);
    }
}
