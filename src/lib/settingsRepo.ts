
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

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    throw error;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getSettings(): Promise<Settings> {
  return await readJSONFile<Settings>(settingsPath, defaultSettings);
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
  await writeJSONFile(settingsPath, newSettings);
  return newSettings;
}
