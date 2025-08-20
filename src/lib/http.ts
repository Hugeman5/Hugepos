export class HttpError extends Error { constructor(public status: number, public data: any) { super(data?.error || `HTTP ${status}`); } }
export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit & { timeout?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = (init as any)?.timeout ?? 5000;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers||{}) } });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    const isJson = ct.includes('application/json');
    const data = !text ? {} : (isJson ? (JSON.parse(text)) : { raw: text });
    if (!res.ok) throw new HttpError(res.status, data);
    return data as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new HttpError(408, { error: 'TIMEOUT' });
    throw e;
  } finally { clearTimeout(timer); }
}
