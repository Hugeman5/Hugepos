
import { promises as fs } from 'fs';
import path from 'path';

export type Settings = {
  currency: string;
  locale: string;
  currencySymbol: string;
  vat: {
    priceIncludesVAT: boolean;
    defaultRate: number;
    categories: Record<string, number>;
    defaultCategory: string;
  };
  rounding: {
    displayDecimals: number;
    cashRounding: boolean;
    cashStep: number;
  };
};

const dataDir = path.join(process.cwd(), 'data');
const settingsPath = path.join(dataDir, 'settings.json');

const defaultSettings: Settings = {
  currency: "ZAR",
  locale: "en-ZA",
  currencySymbol: "R",
  vat: {
    priceIncludesVAT: true,
    defaultRate: 0.15,
    categories: {
      standard: 0.15,
      zero: 0.0,
      exempt: 0.0
    },
    defaultCategory: "standard"
  },
  rounding: {
    displayDecimals: 2,
    cashRounding: false,
    cashStep: 0.10
  }
};

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    return JSON.parse(raw) as Settings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const currentSettings = await getSettings();
  // Deep merge for nested objects like 'vat' and 'rounding'
  const newSettings = { 
      ...currentSettings, 
      ...patch,
      vat: { ...currentSettings.vat, ...patch.vat },
      rounding: { ...currentSettings.rounding, ...patch.rounding }
  };
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8');
  return newSettings;
}
