
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { type User } from './data';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeJSONFile(filePath, defaultValue);
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getAllUsers(): Promise<User[]> {
  return readJSONFile<User[]>(usersPath, []);
}

export async function getUserById(id: string): Promise<User | null> {
    const users = await getAllUsers();
    return users.find(u => u.id === id) || null;
}

export async function saveAllUsers(users: User[]): Promise<void> {
  await writeJSONFile(usersPath, users);
}

export async function upsertUser(userToUpsert: User): Promise<User> {
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
