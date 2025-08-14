import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "users.json");

export type Role = "admin"|"cashier"|"kitchen"|"waiter";
export type UserRow = { id:string; name:string; role:Role; active:boolean; exposeOnPinLogin?:boolean; pin?:string; pinHash?:string };

export async function getAllUsers(): Promise<UserRow[]> {
  const raw = await fs.readFile(FILE, "utf8").catch(()=>"[]");
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
}
export async function saveAllUsers(rows: UserRow[]): Promise<void> {
  const out = JSON.stringify(rows, null, 2) + "\n";
  await fs.writeFile(FILE, out, "utf8");
}