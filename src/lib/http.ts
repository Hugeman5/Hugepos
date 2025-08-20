
export class HttpError extends Error { constructor(public status: number, public data: any) { super(data?.error || `HTTP ${status}`); } }
export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers||{}) }});
  const ct = res.headers.get('content-type') || ''; const text = await res.text();
  let data: any = !text ? {} : (ct.includes('application/json') ? (()=>{ try { return JSON.parse(text); } catch { return { raw: text }; } })() : { raw: text });
  if (!res.ok) throw new HttpError(res.status, data); return data as T;
}
