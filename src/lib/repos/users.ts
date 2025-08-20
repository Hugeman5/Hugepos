import { readJson } from './io';
export type User = { id:string; name:string; role:'admin'|'manager'|'cashier'|'waiter'|'kitchen'; active:boolean; exposeOnPinLogin?:boolean; pin?:string; pinHash?:string; email?:string; username?:string; hourlyRate?:number };
const EMPTY: User[] = [];
const toSafe = (u: User) => ({ id:u.id, name:u.name, role:u.role, active:u.active, exposeOnPinLogin:!!u.exposeOnPinLogin, hourlyRate: u.hourlyRate ?? 0 });
export async function listActiveForPinLogin() { const all = await readJson<User[]>('users.json', EMPTY); return (all||[]).filter(u=>u.active && u.exposeOnPinLogin).map(toSafe); }
