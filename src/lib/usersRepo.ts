import { promises as fs } from "fs";
import path from "path";

const USERS_PATH = path.join(process.cwd(), "data", "users.json");

export type Role = "admin"|"cashier"|"kitchen"|"waiter";
export type UserRow = { id:string; name:string; role:Role; active:boolean; exposeOnPinLogin?:boolean; pin?:string; pinHash?:string };

async function ensureFile(): Promise<void> {
	await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
	try {
		await fs.access(USERS_PATH);
	} catch {
		await fs.writeFile(USERS_PATH, "[]", "utf8");
	}
}

export async function getAllUsers(): Promise<UserRow[]> {
	await ensureFile();
	try {
		const raw = await fs.readFile(USERS_PATH, "utf8");
		return JSON.parse(raw || "[]");
	} catch {
		return [];
	}
}

export async function saveAllUsers(rows: UserRow[]): Promise<void> {
	await ensureFile();
	const out = JSON.stringify(rows, null, 2) + "\n";
	await fs.writeFile(USERS_PATH, out, "utf8");
}