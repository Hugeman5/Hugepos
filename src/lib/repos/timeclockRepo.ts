
import { promises as fs } from "fs";
import path from "path";
import { getAllUsers } from "@/lib/usersRepo";

export type PunchType = "in" | "out" | "breakStart" | "breakEnd";
export type Punch = {
  id: string;
  userId: string;
  type: PunchType;
  ts: string;          // ISO string (UTC)
  station?: string;    // optional: page/role/station
  note?: string;
};

export type ActiveShift = {
  shiftId: string;
  clockInAt: string;
  breaks: Array<{ start: string; end?: string }>;
  stationId?: string;
  role: string;
  hourlyRate: number;
}

export type ShiftHistory = {
  userId: string;
  shiftId: string;
  clockInAt: string;
  clockOutAt: string;
  breaks: Array<{ start: string; end: string }>;
  workedSeconds: number;
  breakSeconds: number;
  paidSeconds: number;
  laborCost: number;
}

export type TimeclockFile = {
  active: Record<string, ActiveShift>;
  history: ShiftHistory[];
};

const FILE = path.join(process.cwd(), "data", "timeclock.json");
const TZ = "Africa/Johannesburg";

async function read(): Promise<TimeclockFile> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw || '{"active":{},"history":[]}');
  } catch {
    const defaultData = { active: {}, history: [] };
    await write(defaultData);
    return defaultData;
  }
}
async function write(data: TimeclockFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}
const uuid = (prefix = "tc_") => prefix + Math.random().toString(36).slice(2, 10);

export async function getStatus(userId: string): Promise<{ active: boolean, shift?: ActiveShift }> {
    const db = await read();
    const shift = db.active[userId];
    return { active: !!shift, shift };
}

export async function clockIn(data: { userId: string; stationId?: string; role?: string; hourlyRate?: number }): Promise<ActiveShift> {
    const db = await read();
    if (db.active[data.userId]) throw new Error("User is already clocked in.");

    const user = (await getAllUsers()).find(u => u.id === data.userId);

    const newShift: ActiveShift = {
        shiftId: `tc_${new Date().toISOString().split('T')[0]}_${data.userId}`,
        clockInAt: new Date().toISOString(),
        breaks: [],
        stationId: data.stationId,
        role: data.role || user?.role || 'cashier',
        hourlyRate: data.hourlyRate ?? user?.hourlyRate ?? 0,
    };
    db.active[data.userId] = newShift;
    await write(db);
    return newShift;
}

export async function clockOut(userId: string): Promise<ShiftHistory> {
    const db = await read();
    const shift = db.active[userId];
    if (!shift) throw new Error("User is not clocked in.");
    
    const clockOutTime = new Date();
    const clockInTime = new Date(shift.clockInAt);
    
    const breakSeconds = shift.breaks.reduce((total, b) => {
        const start = new Date(b.start).getTime();
        const end = b.end ? new Date(b.end).getTime() : clockOutTime.getTime();
        return total + (end - start) / 1000;
    }, 0);

    const workedSeconds = (clockOutTime.getTime() - clockInTime.getTime()) / 1000;
    const paidSeconds = workedSeconds - breakSeconds;
    const laborCost = (paidSeconds / 3600) * shift.hourlyRate;

    const historyEntry: ShiftHistory = {
        userId,
        shiftId: shift.shiftId,
        clockInAt: shift.clockInAt,
        clockOutAt: clockOutTime.toISOString(),
        breaks: shift.breaks.filter(b => b.end) as any, // Only save completed breaks
        workedSeconds,
        breakSeconds,
        paidSeconds,
        laborCost,
    };

    db.history.unshift(historyEntry);
    delete db.active[userId];
    await write(db);
    return historyEntry;
}


export async function startBreak(userId: string): Promise<ActiveShift> {
    const db = await read();
    const shift = db.active[userId];
    if (!shift) throw new Error("User is not clocked in.");
    if (shift.breaks.some(b => !b.end)) throw new Error("User is already on break.");

    shift.breaks.push({ start: new Date().toISOString() });
    await write(db);
    return shift;
}

export async function endBreak(userId: string): Promise<ActiveShift> {
    const db = await read();
    const shift = db.active[userId];
    if (!shift) throw new Error("User is not clocked in.");
    const openBreak = shift.breaks.find(b => !b.end);
    if (!openBreak) throw new Error("User is not on break.");

    openBreak.end = new Date().toISOString();
    await write(db);
    return shift;
}

export async function getReport(from?: string, to?: string) {
    const { history } = await read();
    const fromTime = from ? new Date(from).getTime() : 0;
    const toTime = to ? new Date(to).getTime() : Date.now();
    
    const filtered = history.filter(h => {
        const ts = new Date(h.clockInAt).getTime();
        return ts >= fromTime && ts <= toTime;
    });

    const summary: Record<string, { totalPaidSeconds: number; totalLaborCost: number; shifts: number }> = {};
    for(const h of filtered) {
        if (!summary[h.userId]) summary[h.userId] = { totalPaidSeconds: 0, totalLaborCost: 0, shifts: 0 };
        summary[h.userId].totalPaidSeconds += h.paidSeconds;
        summary[h.userId].totalLaborCost += h.laborCost;
        summary[h.userId].shifts++;
    }
    return summary;
}
