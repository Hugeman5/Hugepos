
import { fetchJson } from '@/lib/http';
export const getClockStatus = (userId: string) => fetchJson<{ active: boolean; shift?: any }>(`/api/timeclock/status?userId=${encodeURIComponent(userId)}`);
export const postClockIn = (p: { userId: string; stationId?: string; role?: string; hourlyRate?: number }) =>
  fetchJson('/api/timeclock/clockin', { method: 'POST', body: JSON.stringify(p) });
export const postClockOut = (p: { userId: string }) => fetchJson('/api/timeclock/clockout', { method: 'POST', body: JSON.stringify(p) });
export const postBreakStart = (p: { userId: string }) => fetchJson('/api/timeclock/break/start', { method: 'POST', body: JSON.stringify(p) });
export const postBreakEnd = (p: { userId: string }) => fetchJson('/api/timeclock/break/end', { method: 'POST', body: JSON.stringify(p) });

