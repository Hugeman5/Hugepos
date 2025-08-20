
import { readJson, writeJsonAtomic } from "./repos/io";

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
  active: boolean;
  exposeOnPinLogin?: boolean;
  pin?: string;
  pinHash?: string;
  email?: string;
  username?: string;
  hourlyRate?: number;
};

const EMPTY: User[] = [];

export async function getAllUsers(): Promise<User[]> {
  const users = await readJson<User[]>('users.json', EMPTY);
  return Array.isArray(users) ? users : EMPTY;
}

export async function saveAllUsers(users: User[]) {
  await writeJsonAtomic('users.json', users);
}

export async function getUserById(id: string): Promise<User | null> {
    const users = await getAllUsers();
    return users.find(u => u.id === id) || null;
}

export async function upsertUser(userToUpsert: User): Promise<User> {
    const users = await getAllUsers();
    const index = users.findIndex(u => u.id === userToUpsert.id);

    if (index > -1) {
        users[index] = { ...users[index], ...userToUpsert };
    } else {
        users.push(userToUpsert);
    }
    await saveAllUsers(users);
    return userToUpsert;
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
    let users = await getAllUsers();
    const initialCount = users.length;
    users = users.filter(u => u.id !== id);

    if (users.length === initialCount) {
        return { success: false }; // User not found
    }

    await saveAllUsers(users);
    return { success: true };
}

export async function resetPin(id: string, newPin: string): Promise<{ success: boolean }> {
    const users = await getAllUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
        return { success: false }; // User not found
    }

    user.pin = newPin;
    await saveAllUsers(users);
    return { success: true };
}


export type SafeUser = Pick<User, 'id' | 'name' | 'role' | 'active' | 'exposeOnPinLogin' | 'hourlyRate'> & { uid: string };
export function toSafe(u: User): SafeUser {
  const { id, name, role, active, exposeOnPinLogin, hourlyRate } = u;
  return { id, uid: id, name, role, active, exposeOnPinLogin: !!exposeOnPinLogin, hourlyRate: hourlyRate ?? 0 };
}

export async function listActiveForPinLogin(): Promise<SafeUser[]> {
  const all = await getAllUsers();
  return all.filter((u) => u.active && u.exposeOnPinLogin).map(toSafe);
}

function matchIdentifier(u: User, identifier: string): boolean {
  const id = identifier.trim().toLowerCase();
  return (
    u.id.toLowerCase() === id ||
    (u.email?.toLowerCase() === id) ||
    (u.username?.toLowerCase() === id)
  );
}

async function comparePin(u: User, pin: string): Promise<boolean> {
  if (!pin) return false;
  if (u.pinHash && u.pinHash.startsWith('$2')) {
    try {
      const bcrypt = await import('bcryptjs');
      return await bcrypt.compare(pin, u.pinHash);
    } catch {
      // fall back to plain pin
    }
  }
  return String(u.pin ?? '') === String(pin);
}

export async function verifyPin(identifier: string, pin: string): Promise<SafeUser | null> {
  const users = await getAllUsers();
  const u = users.find((user) => matchIdentifier(user, identifier));
  if (!u || !u.active) return null;
  const ok = await comparePin(u, pin);
  return ok ? toSafe(u) : null;
}
