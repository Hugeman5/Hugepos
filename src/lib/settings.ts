

import { promises as fs } from "fs";
import path from "path";

export type AppSettings = {
  currency: string;        // "ZAR"
  locale: string;          // "en-ZA"
  currencySymbol: string;  // "R"
  defaultVatRate: number;  // 0.15
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

let cached: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    cached = JSON.parse(raw) as AppSettings;
  } catch {
    cached = { currency: "ZAR", locale: "en-ZA", currencySymbol: "R", defaultVatRate: 0.15 };
  }
  return cached!;
}
