// src/lib/repos/io.ts
// Why: fresh reads per request + atomic writes to avoid 500s on missing files
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const p = path.join(DATA_DIR, file);
    await fsp.mkdir(path.dirname(p), { recursive: true });
    const buf = await fsp.readFile(p, 'utf8');
    return JSON.parse(buf) as T;
  } catch (e: any) {
    if (e && e.code === 'ENOENT') {
        // File doesn't exist, create it with fallback content
        await writeJsonAtomic(file, fallback);
        return fallback;
    }
    // For other errors (like parsing), it might be better to throw
    // but for robustness against empty/corrupt files, we can return fallback.
    console.error(`Error reading or parsing ${file}, returning fallback.`, e);
    return fallback;
  }
}

export async function writeJsonAtomic<T>(file: string, data: T): Promise<void> {
  const p = path.join(DATA_DIR, file);
  await fsp.mkdir(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  const json = JSON.stringify(data, null, 2);
  await fsp.writeFile(tmp, json, 'utf8');
  await fsp.rename(tmp, p);
}

export function nowIso(): string { return new Date().toISOString(); }
