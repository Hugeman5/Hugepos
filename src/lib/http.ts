
export class HttpError extends Error { constructor(public status: number, public data: any) { super(data?.error || `HTTP ${status}`); } }
export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) }});
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new HttpError(res.status, json);
  return json as T;
}
