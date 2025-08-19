
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
    return JSON.parse(raw || '{"punches":[]}');
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
    const allUsers = await getAllUsers();
    const usersMap = new Map(allUsers.map(u => [u.id, u]));

    const allUserPunches = await listPunches({ userId: opts.userId });
    
    const byUser: Record<string, { totalMs: number, earningsZar: number }> = {};
    const punchesByUser: Record<string, Punch[]> = {};
    
    for (const punch of allUserPunches) {
        if (!punchesByUser[punch.userId]) punchesByUser[punch.userId] = [];
        punchesByUser[punch.userId].push(punch);
    }

    const fromTime = new Date(opts.from).getTime();
    const toTime = new Date(opts.to).getTime();

    for (const userId of Object.keys(punchesByUser)) {
        if (!usersMap.has(userId)) continue;

        const userPunches = punchesByUser[userId];
        const user = usersMap.get(userId);
        const hourlyRate = user?.hourlyRate ?? 0;
        
        if (!byUser[userId]) byUser[userId] = { totalMs: 0, earningsZar: 0 };
        
        let sessionStart: number | null = null;
        
        // Find initial state before the 'from' date
        const punchesBefore = allUserPunches.filter(p => p.userId === userId && new Date(p.ts).getTime() < fromTime);
        const lastPunchBefore = punchesBefore.pop();

        if (lastPunchBefore) {
            if (lastPunchBefore.type === 'in' || lastPunchBefore.type === 'breakEnd') {
                sessionStart = fromTime; // Start counting from the beginning of the range
            }
        }

        for (const punch of userPunches) {
            const punchTime = new Date(punch.ts).getTime();

            if (punchTime < fromTime || punchTime > toTime) continue;
            
            if (punch.type === 'in' || punch.type === 'breakEnd') {
                if (sessionStart) console.warn(`Consecutive clock-in/break-end for ${userId}`);
                sessionStart = punchTime;
            } else if ((punch.type === 'out' || punch.type === 'breakStart') && sessionStart) {
                byUser[userId].totalMs += (punchTime - sessionStart);
                sessionStart = null;
            }
        }
        
        if (sessionStart) { // Still clocked in at end of range
            byUser[userId].totalMs += (toTime - sessionStart);
        }

        byUser[userId].earningsZar = (byUser[userId].totalMs / 3600000) * hourlyRate;
    }
    
    return byUser;
}

export async function statusFor(userId: string) {
  const punches = await listPunches({ userId });
  const lastPunch = punches[punches.length - 1];
  if (!lastPunch) return { state: "off" as const };
  if (lastPunch.type === "out") return { state: "off" as const };
  if (lastPunch.type === "breakStart") return { state: "break" as const };
  return { state: "on" as const };
}

export async function clockIn(userId: string, ts = Date.now()) {
  const status = await statusFor(userId);
  if (status.state !== 'off') return; // Idempotent
  await addPunch({ userId, type: 'in', ts: new Date(ts).toISOString() });
}

export async function breakStart(userId: string, ts = Date.now()) {
  const status = await statusFor(userId);
  if (status.state !== 'on') return; // Can only start break if 'on'
  await addPunch({ userId, type: 'breakStart', ts: new Date(ts).toISOString() });
}

export async function breakEnd(userId: string, ts = Date.now()) {
  const status = await statusFor(userId);
  if (status.state !== 'break') return; // Can only end a break if 'on break'
  await addPunch({ userId, type: 'breakEnd', ts: new Date(ts).toISOString() });
}

export async function clockOut(userId: string, ts = Date.now()) {
  const status = await statusFor(userId);
  if (status.state === 'off') return; // Idempotent
  await addPunch({ userId, type: 'out', ts: new Date(ts).toISOString() });
}


export async function summary(fromISO?: string, toISO?: string) {
  const from = fromISO ? new Date(fromISO) : undefined;
  const to   = toISO   ? new Date(toISO)   : undefined;

  const allShifts = await listPunches({ from: from?.toISOString(), to: to?.toISOString() });
  const users = await getAllUsers(); // { id, hourlyRate?, name? }
  const usersMap = new Map(users.map(u => [u.id, u]));

  const punchesByUser: Record<string, Punch[]> = {};
    for (const punch of allShifts) {
        if (!punchesByUser[punch.userId]) punchesByUser[punch.userId] = [];
        punchesByUser[punch.userId].push(punch);
    }
  
  const byUser = new Map<string, { minutes: number; shifts: number; hourlyRate: number; name: string }>();

  for (const userId in punchesByUser) {
    const userPunches = punchesByUser[userId];
    const user = usersMap.get(userId);
    const rate = Number(user?.hourlyRate ?? 0);
    const name = String(user?.name ?? userId);

    let totalMs = 0;
    let shiftCount = 0;
    let sessionStart: number | null = null;
    let breakStart: number | null = null;

    for (const p of userPunches) {
        const ts = new Date(p.ts).getTime();
        
        if (p.type === 'in') {
            if (sessionStart) console.warn(`Found clock-in for ${userId} while already clocked in.`);
            sessionStart = ts;
            shiftCount++;
        } else if (p.type === 'breakStart') {
            if (sessionStart) {
                totalMs += (ts - sessionStart);
            }
            sessionStart = null; // Pause work timer
            breakStart = ts;
        } else if (p.type === 'breakEnd') {
            breakStart = null;
            sessionStart = ts; // Resume work timer
        } else if (p.type === 'out') {
            if (sessionStart) {
                 totalMs += (ts - sessionStart);
            }
            sessionStart = null;
            breakStart = null;
        }
    }
    
    const acc = byUser.get(userId) ?? { minutes: 0, shifts: 0, hourlyRate: rate, name };
    acc.minutes += Math.round(totalMs / 60000);
    acc.shifts = shiftCount;
    acc.hourlyRate = rate;
    acc.name = name;
    byUser.set(userId, acc);
  }

  // shape: array so it’s easy to render
  const rows = [...byUser.entries()].map(([userId, v]) => {
    const hours = v.minutes / 60;
    const wage  = hours * v.hourlyRate;
    return { userId, name: v.name, shifts: v.shifts, minutes: v.minutes, hours: Number(hours.toFixed(2)), hourlyRate: v.hourlyRate, wage: Number(wage.toFixed(2)) };
  });

  return { rows };
}
