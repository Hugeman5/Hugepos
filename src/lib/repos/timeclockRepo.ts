
import { readJson, writeJsonAtomic, nowIso } from './io';
import { type User } from '../data';
import { getAllUsers } from '../usersRepo';

export interface ActiveShift {
  shiftId: string;
  clockInAt: string;
  breaks: Array<{ start: string; end?: string | null }>;
  stationId?: string;
  role?: string;
  hourlyRate?: number;
}

export interface TimeClockFile {
  active: Record<string, ActiveShift>;
  history: Array<{
    userId: string;
    shiftId: string;
    clockInAt: string;
    clockOutAt: string;
    breaks: Array<{ start: string; end: string }>;
    workedSeconds: number;
    breakSeconds: number;
    paidSeconds: number;
    laborCost: number;
  }>;
}

const DEFAULT_TC: TimeClockFile = { active: {}, history: [] };

function secs(a: string, b: string) { return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 1000); }

export async function getStatus(userId: string) {
  const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
  const shift = file.active[userId];
  return { active: Boolean(shift), shift: shift || null };
}

export async function clockIn(userId: string, stationId?: string, role?: string, hourlyRate = 0) {
  const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
  if (file.active[userId]) return { ok: false as const, status: 409, error: 'ALREADY_CLOCKED_IN' };
  const shiftId = `tc_${userId}_${Date.now()}`;
  file.active[userId] = { shiftId, clockInAt: nowIso(), breaks: [], stationId, role, hourlyRate };
  await writeJsonAtomic('timeclock.json', file);
  return { ok: true as const, shiftId };
}

export async function clockOut(userId: string) {
  const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
  const act = file.active[userId];
  if (!act) return { ok: false as const, status: 409, error: 'NOT_CLOCKED_IN' };
  const outAt = nowIso();
  if (act.breaks.length && !act.breaks[act.breaks.length - 1].end) act.breaks[act.breaks.length - 1].end = outAt;
  const workedSeconds = secs(act.clockInAt, outAt);
  const breakSeconds = act.breaks.reduce((s, b) => s + (b.end ? secs(b.start, b.end) : 0), 0);
  const paidSeconds = Math.max(0, workedSeconds - breakSeconds);
  const laborCost = (act.hourlyRate || 0) * (paidSeconds / 3600);
  file.history.unshift({ userId, shiftId: act.shiftId, clockInAt: act.clockInAt, clockOutAt: outAt, breaks: act.breaks.map(b => ({ start: b.start, end: b.end! })), workedSeconds, breakSeconds, paidSeconds, laborCost });
  delete file.active[userId];
  await writeJsonAtomic('timeclock.json', file);
  return { ok: true as const, totals: { workedSeconds, breakSeconds, paidSeconds, laborCost } };
}

export async function breakStart(userId: string) {
  const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
  const act = file.active[userId];
  if (!act) return { ok: false as const, status: 409, error: 'NOT_CLOCKED_IN' };
  const last = act.breaks[act.breaks.length - 1];
  if (last && !last.end) return { ok: false as const, status: 409, error: 'ALREADY_ON_BREAK' };
  act.breaks.push({ start: nowIso(), end: null });
  await writeJsonAtomic('timeclock.json', file);
  return { ok: true as const };
}

export async function breakEnd(userId: string) {
  const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
  const act = file.active[userId];
  if (!act) return { ok: false as const, status: 409, error: 'NOT_CLOCKED_IN' };
  const last = act.breaks[act.breaks.length - 1];
  if (!last || last.end) return { ok: false as const, status: 409, error: 'NOT_ON_BREAK' };
  last.end = nowIso();
  await writeJsonAtomic('timeclock.json', file);
  return { ok: true as const };
}

export async function listPunches(filters: {userId?: string; from?: string; to?: string}) {
    const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
    let all = file.history;
    if(filters.userId) all = all.filter(p => p.userId === filters.userId);
    if(filters.from) all = all.filter(p => p.clockInAt >= filters.from!);
    if(filters.to) all = all.filter(p => p.clockInAt <= filters.to!);
    return all;
}

export async function earningsForRange(filters: {userId?: string; from?: string; to?: string}) {
    const punches = await listPunches(filters);
    const users = await getAllUsers();
    const userMap = new Map(users.map(u => [u.id, u]));

    const report: Record<string, { totalMs: number; earningsZar: number }> = {};

    for(const p of punches) {
        if (!report[p.userId]) report[p.userId] = { totalMs: 0, earningsZar: 0 };
        const rate = userMap.get(p.userId)?.hourlyRate || 0;
        report[p.userId].totalMs += p.paidSeconds * 1000;
        report[p.userId].earningsZar += p.laborCost;
    }
    return report;
}

export async function activeNow(): Promise<Array<{userId:string; startedAt:string; elapsedMs:number}>> {
    const file = await readJson<TimeClockFile>('timeclock.json', DEFAULT_TC);
    const now = Date.now();
    return Object.entries(file.active).map(([userId, shift]) => ({
        userId,
        startedAt: shift.clockInAt,
        elapsedMs: now - new Date(shift.clockInAt).getTime(),
    }));
}
