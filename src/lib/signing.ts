import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const dataDir = path.join(process.cwd(), 'data');
const secretsPath = path.join(dataDir, 'secrets.json');

type Secrets = {
  receiptSignKey: string;
};

async function getSecrets(): Promise<Secrets> {
  try {
    const data = await fs.readFile(secretsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Secrets file not found, generating a new one...');
      const newSecrets: Secrets = {
        receiptSignKey: crypto.randomBytes(32).toString('hex'),
      };
      await fs.mkdir(path.dirname(secretsPath), { recursive: true });
      await fs.writeFile(secretsPath, JSON.stringify(newSecrets, null, 2), 'utf-8');
      return newSecrets;
    }
    throw error;
  }
}

let _receiptSignKey: string | null = null;
async function getSigningKey(): Promise<string> {
    if (!_receiptSignKey) {
        const secrets = await getSecrets();
        _receiptSignKey = secrets.receiptSignKey;
    }
    return _receiptSignKey;
}

export async function signReceipt(payload: { orderId: string; totalCents: number; ts: string }): Promise<string> {
  const key = await getSigningKey();
  const data = `${payload.orderId}.${payload.totalCents}.${payload.ts}`;
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

export async function verifyReceipt(payload: { orderId: string; totalCents: number; ts: string; sig: string }): Promise<boolean> {
  const expectedSig = await signReceipt({ orderId: payload.orderId, totalCents: payload.totalCents, ts: payload.ts });
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(payload.sig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false; // Handle cases where buffers have different lengths
  }
}
