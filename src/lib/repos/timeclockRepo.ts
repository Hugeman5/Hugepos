
import { promises as fs } from "fs";
import path from "path";
import { zonedTimeToUtc } from "date-fns-tz";

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
    return { punches: [], settings: { timezone: TZ, roundingMinutes: 1 } };
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
  const ts = p.ts ?? zonedTimeToUtc(new Date(), db.settings?.timezone || TZ).toISOString();
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

/** Pair IN/OUT to compute durations (ignores breaks for v1 or subtracts them if pairs exist) */
export async function summary(opts:{ userId?:string; from?:string; to?:string }) {
  const rows = await listPunches(opts);
  const byUser: Record<string, { totalMs:number; days: Record<string,number> }> = {};
  const open: Record<string, Punch|null> = {};

  for (const p of rows) {
    const key = p.userId;
    byUser[key] ??= { totalMs:0, days:{} };
    if (p.type === "in") {
      open[key] = p;
    } else if (p.type === "out" && open[key]) {
      const ms = new Date(p.ts).getTime() - new Date(open[key]!.ts).getTime();
      byUser[key].totalMs += Math.max(0, ms);
      const day = new Date(open[key]!.ts).toISOString().slice(0,10);
      byUser[key].days[day] = (byUser[key].days[day]||0) + Math.max(0, ms);
      open[key] = null;
    }
    // (Optional) breakStart/breakEnd handling can be added later to subtract break time
  }

  return byUser;
}
