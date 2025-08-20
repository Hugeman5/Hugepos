
import { readJson, writeJsonAtomic } from './repos/io';

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
  requireClockedInToTransact?: boolean;
};

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
  },
  requireClockedInToTransact: true,
};

export async function getSettings(): Promise<Settings> {
  return await readJson<Settings>('settings.json', defaultSettings);
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const currentSettings = await getSettings();
  const newSettings = { 
      ...currentSettings, 
      ...patch,
      vat: { ...currentSettings.vat, ...patch.vat },
      rounding: { ...currentSettings.rounding, ...patch.rounding }
  };
  await writeJsonAtomic('settings.json', newSettings);
  return newSettings;
}
