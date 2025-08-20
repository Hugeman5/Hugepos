// src/lib/repos/timeclock.ts
import { readJson, writeJsonAtomic, nowIso } from './io';

export interface TimeClockFile {
  active: Record<string, {
    shiftId: string;
    clockInAt: string;
    breaks: Array<{ start: string; end?: string | null }>;
    stationId?: string;
    role?: string;
    hourlyRate?: number;
  }>;
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
  // close any open break
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
