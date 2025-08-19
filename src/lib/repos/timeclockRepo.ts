

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

export type TimeclockFile = {
  punches: Punch[];
  settings?: {
    timezone?: string;          // default "Africa/Johannesburg"
    roundingMinutes?: number;   // default 1 (no rounding). Could be 15 later
  };
};

const FILE = path.join(process.cwd(), "data", "timeclock.json");
const TZ = "Africa/Johannesburg";

async function read(): Promise<TimeclockFile> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    const defaultData = { punches: [], settings: { timezone: TZ, roundingMinutes: 1 } };
    await write(defaultData);
    return defaultData;
  }
}
async function write(data: TimeclockFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}
const uuid = () => "tc_" + Math.random().toString(36).slice(2, 10);

export async function addPunch(p: Omit<Punch,"id"|"ts"> & { ts?: string }) {
  const db = await read();
  const id = uuid();
  const ts = p.ts ?? new Date().toISOString();
  db.punches.push({ id, userId: p.userId, type: p.type, ts, station: p.station, note: p.note });
  await write(db);
  return { id, ts };
}
export async function updatePunch(id:string, patch: Partial<Omit<Punch,"id">>) {
  const db = await read();
  const i = db.punches.findIndex(x=>x.id===id);
  if (i<0) return null;
  db.punches[i] = { ...db.punches[i], ...patch };
  await write(db);
  return db.punches[i];
}
export async function deletePunch(id:string) {
  const db = await read();
  const before = db.punches.length;
  db.punches = db.punches.filter(p=>p.id!==id);
  await write(db);
  return before - db.punches.length;
}
export async function listPunches(opts?: { userId?:string; from?:string; to?:string }) {
  const db = await read();
  let rows = db.punches.slice().sort((a,b)=>a.ts.localeCompare(b.ts));
  if (opts?.userId) rows = rows.filter(p=>p.userId===opts.userId);
  if (opts?.from) rows = rows.filter(p=>p.ts >= opts.from!);
  if (opts?.to) rows = rows.filter(p=>p.ts < opts.to!);
  return rows;
}

function pairShifts(punches: Punch[]): { start: Punch, end: Punch | null }[] {
    const pairs: { start: Punch, end: Punch | null }[] = [];
    let openPunch: Punch | null = null;

    for (const punch of punches) {
        if (punch.type === 'in' || punch.type === 'breakEnd') {
            if (openPunch) {
                // Found a new 'in' without a previous 'out', so the previous one is orphaned.
                pairs.push({ start: openPunch, end: null });
            }
            openPunch = punch;
        } else if ((punch.type === 'out' || punch.type === 'breakStart') && openPunch) {
            pairs.push({ start: openPunch, end: punch });
            openPunch = null;
        }
    }
    // If the loop finishes and there's still an open punch, add it as an open shift.
    if (openPunch) {
        pairs.push({ start: openPunch, end: null });
    }
    return pairs;
}


export async function activeNow() {
    const oneDayAgo = new Date(Date.now() - 24 * 3600e3).toISOString();
    const recentPunches = await listPunches({ from: oneDayAgo });

    const activeUsers: { userId: string, startedAt: string, elapsedMs: number }[] = [];
    const punchesByUser: Record<string, Punch[]> = {};

    for (const punch of recentPunches) {
        if (!punchesByUser[punch.userId]) punchesByUser[punch.userId] = [];
        punchesByUser[punch.userId].push(punch);
    }
    
    for (const userId in punchesByUser) {
        const userPunches = punchesByUser[userId];
        const lastPunch = userPunches[userPunches.length - 1];
        if (lastPunch && (lastPunch.type === 'in' || lastPunch.type === 'breakEnd')) {
             activeUsers.push({
                userId,
                startedAt: lastPunch.ts,
                elapsedMs: new Date().getTime() - new Date(lastPunch.ts).getTime()
            });
        }
    }
    
    return activeUsers;
}


export async function earningsForRange(opts: { from: string, to: string, userId?: string }) {
    const punches = await listPunches(opts);
    const users = await getAllUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    
    const byUser: Record<string, { totalMs: number, earningsZar: number }> = {};
    
    const punchesByUser: Record<string, Punch[]> = {};
    for (const punch of punches) {
        if (!punchesByUser[punch.userId]) punchesByUser[punch.userId] = [];
        punchesByUser[punch.userId].push(punch);
    }
    
    const now = new Date(opts.to); // Use end of range as "now"

    for (const userId of Object.keys(usersMap)) {
        if (opts.userId && userId !== opts.userId) continue;

        const userPunches = punchesByUser[userId] || [];
        const user = usersMap.get(userId);
        const hourlyRate = user?.hourlyRate ?? 0;

        if (!byUser[userId]) {
            byUser[userId] = { totalMs: 0, earningsZar: 0 };
        }
        
        // Find the last punch before the 'from' date to establish initial state
        const allUserPunches = await listPunches({ userId });
        const lastPunchBeforeRange = allUserPunches.filter(p => p.ts < opts.from).pop();

        let openPunch: Punch | null = null;
        if(lastPunchBeforeRange && (lastPunchBeforeRange.type === 'in' || lastPunchBeforeRange.type === 'breakEnd')) {
            openPunch = lastPunchBeforeRange;
        }


        for (const punch of userPunches) {
             if (punch.type === 'in' || punch.type === 'breakEnd') {
                if (openPunch) { // Clocked in twice, ignore previous
                    console.warn(`Consecutive clock-in for ${userId} at ${punch.ts}`);
                }
                openPunch = punch;
            } else if ((punch.type === 'out' || punch.type === 'breakStart') && openPunch) {
                const startTime = new Date(openPunch.ts);
                const endTime = new Date(punch.ts);
                const ms = endTime.getTime() - startTime.getTime();
                byUser[userId].totalMs += Math.max(0, ms);
                openPunch = null;
            }
        }
        
        // If still clocked in at the end of the range, calculate duration up to 'to' date
        if (openPunch) {
            const startTime = new Date(openPunch.ts);
            const endTime = now;
            const ms = endTime.getTime() - startTime.getTime();
            byUser[userId].totalMs += Math.max(0, ms);
        }

        byUser[userId].earningsZar = (byUser[userId].totalMs / 3600000) * hourlyRate;
    }
    return byUser;
}

