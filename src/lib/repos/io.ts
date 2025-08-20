import fsp from 'node:fs/promises';
import path from 'node:path';
const DATA_DIR = path.join(process.cwd(), 'data');
export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fsp.readFile(path.join(DATA_DIR, file), 'utf8')) as T; }
  catch (e: any) { if (e?.code === 'ENOENT') return fallback; throw e; }
}
