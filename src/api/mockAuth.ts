
import { fetchJson } from '../lib/http';
export type SafeUser = { id: string; name: string; role: string; active: boolean; exposeOnPinLogin?: boolean; hourlyRate?: number };
export const getActiveUsers = () => fetchJson<SafeUser[]>('/api/mock-auth/active-users');
export const postVerify = (identifier: string, pin: string) => fetchJson<{ ok: true; user: SafeUser }|{ ok:false; error:string }>('/api/mock-auth/verify', { method:'POST', body: JSON.stringify({ identifier, pin }) });
