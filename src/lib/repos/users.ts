import { readJson } from './io';

export type User = {
  id: string; name: string; role: 'admin'|'manager'|'cashier'|'waiter'|'kitchen';
  active: boolean; exposeOnPinLogin?: boolean; pin?: string; pinHash?: string;
  email?: string; username?: string; hourlyRate?: number;
};

const EMPTY: User[] = [];

export async function loadUsers(): Promise<User[]> {
  const users = await readJson<User[]>('users.json', EMPTY);
  return Array.isArray(users) ? users : EMPTY;
}

export type SafeUser = Pick<User, 'id'|'name'|'role'|'active'|'exposeOnPinLogin'|'hourlyRate'>;
export function toSafe(u: User): SafeUser { const { id, name, role, active, exposeOnPinLogin, hourlyRate } = u; return { id, name, role, active, exposeOnPinLogin: !!exposeOnPinLogin, hourlyRate: hourlyRate ?? 0 }; }

export async function listActiveForPinLogin(): Promise<SafeUser[]> {
  const all = await loadUsers();
  return all.filter(u => u.active && u.exposeOnPinLogin).map(toSafe);
}

function matchIdentifier(u: User, identifier: string): boolean {
  const id = identifier.trim().toLowerCase();
  return u.id.toLowerCase() === id || (u.email?.toLowerCase() === id) || (u.username?.toLowerCase() === id);
}

// Dev: 4-digit PINs. If pinHash exists and looks like bcrypt, try to use it when available.
async function comparePin(u: User, pin: string): Promise<boolean> {
  if (!pin) return false;
  if (u.pinHash && u.pinHash.startsWith('$2')) {
    try { const bcrypt = await import('bcryptjs'); return await bcrypt.compare(pin, u.pinHash); } catch { /* fall back */ }
  }
  return String(u.pin ?? '') === String(pin);
}

export async function verifyPin(identifier: string, pin: string): Promise<SafeUser | null> {
  const users = await loadUsers();
  const u = users.find(user => matchIdentifier(user, identifier));
  if (!u || !u.active) return null;
  const ok = await comparePin(u, pin);
  return ok ? toSafe(u) : null;
}
