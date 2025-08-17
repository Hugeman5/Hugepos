import { promises as fs } from "fs";
import path from "path";

export type Settings = { currency:string; vatRate:number; rounding:"none"|"99c"|"95c" };
const P = path.join(process.cwd(), "data", "settings.json");

export async function getSettings(): Promise<Settings> {
  try { return JSON.parse(await fs.readFile(P,"utf8")); }
  catch { return { currency:"ZAR", vatRate:0.15, rounding:"99c" }; }
}
