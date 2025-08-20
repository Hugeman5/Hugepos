import { fetchJson } from '../lib/http';
import { User } from '@/lib/repos/users';

export type SafeUser = { id:string; name:string; role:string; active:boolean; exposeOnPinLogin?:boolean; hourlyRate?:number };
const CACHE_KEY = 'cache.activeUsers.v1';
export async function getActiveUsers(): Promise<SafeUser[]> {
  const users = await fetchJson<SafeUser[]>('/api/mock-auth/active-users', { timeout: 5000 });
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(users)); } catch {}
  return users;
}
export function getCachedActiveUsers(): SafeUser[] | null {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export async function postVerify(identifier: string, pin: string) {
    return fetchJson('/api/mock-auth/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier, pin }),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
}
