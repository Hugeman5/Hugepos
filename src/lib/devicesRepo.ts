
import { promises as fs } from 'fs';
import path from 'path';
import { type DeviceConfig, type Printer, type CashDrawer, type Scanner } from './data';

const dataDir = path.join(process.cwd(), 'data');
const devicesPath = path.join(dataDir, 'devices.json');

const defaultConfig: DeviceConfig = {
    printers: [],
    drawers: [],
    scanners: []
};

async function readConfig(): Promise<DeviceConfig> {
  try {
    await fs.access(devicesPath);
    const data = await fs.readFile(devicesPath, 'utf-8');
    return JSON.parse(data) as DeviceConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await saveConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
}

async function saveConfig(data: DeviceConfig): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(devicesPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getConfig(): Promise<DeviceConfig> {
  return await readConfig();
}

export async function updateConfig(patch: Partial<DeviceConfig>): Promise<DeviceConfig> {
    const config = await getConfig();
    const newConfig = { ...config, ...patch };
    await saveConfig(newConfig);
    return newConfig;
}

// --- Specific device getters ---

export async function listPrinters(): Promise<Printer[]> {
    const config = await getConfig();
    return config.printers;
}

export async function getPrinter(id: string): Promise<Printer | null> {
    const printers = await listPrinters();
    return printers.find(p => p.id === id) || null;
}

export async function listDrawers(): Promise<CashDrawer[]> {
    const config = await getConfig();
    return config.drawers;
}

export async function getDrawer(id: string): Promise<CashDrawer | null> {
    const drawers = await listDrawers();
    return drawers.find(d => d.id === id) || null;
}

export async function listScanners(): Promise<Scanner[]> {
    const config = await getConfig();
    return config.scanners;
}
