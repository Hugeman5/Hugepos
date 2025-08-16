'use server';

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { type User } from "./data";

export type RepoUser = User & {
  pinHash?: string;
}

const USERS_PATH = path.join(process.cwd(), "data", "users.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
  try { await fs.access(USERS_PATH); } catch { await fs.writeFile(USERS_PATH, "[]", "utf8"); }
}

export async function getAllUsers(): Promise<RepoUser[]> {
  await ensureFile();
  try { return JSON.parse(await fs.readFile(USERS_PATH, "utf8") || "[]"); }
  catch { return []; }
}

export async function saveAllUsers(users: RepoUser[]) {
  await ensureFile();
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf8");
}

export async function getUserById(id: string): Promise<RepoUser | null> {
    const users = await getAllUsers();
    return users.find(u => u.id === id) || null;
}

export async function upsertUser(userToUpsert: RepoUser): Promise<RepoUser> {
    const users = await getAllUsers();
    const index = users.findIndex(u => u.id === userToUpsert.id);

    if (index > -1) {
        users[index] = userToUpsert;
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

const sha256 = (s:string)=> crypto.createHash("sha256").update(s,"utf8").digest("hex");

export async function verifyUserByIdentifierAndPin(identifier: string, pin: string) {
  const idLower = identifier.trim().toLowerCase();
  const users = await getAllUsers();
  const u = users.find(x =>
    (x.active !== false) &&
    (String(x.id).toLowerCase() === idLower || String(x.name).trim().toLowerCase() === idLower)
  );
  if (!u) return null;
  const ok = (u.pin && u.pin === pin) || (u.pinHash && u.pinHash === sha256(pin));
  if (!ok) return null;
  return { uid: u.id, name: u.name, role: u.role };
}
