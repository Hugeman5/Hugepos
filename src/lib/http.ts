// src/lib/http.ts
export class HttpError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(typeof data?.error === 'string' ? data.error : `HTTP ${status}`);
    this.status = status;
    this.data = data;
  }
}

/**
 * Robust fetch that tolerates empty/non‑JSON responses.
 * - If body empty → returns {} for ok responses
 * - If content‑type is JSON → parse safely; on parse error for non‑ok → throw HttpError
 * - If non‑JSON text → wrap as { raw }
 */
export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers || {}) },
  });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text(); // always read once

  let data: any;
  if (!text) {
    data = {};
  } else if (contentType.includes('application/json')) {
    try { data = JSON.parse(text); }
    catch (e) {
      // For non‑ok responses, surface parse error; for ok, fall back to {}
      if (!res.ok) throw new HttpError(res.status, { error: 'INVALID_JSON_RESPONSE', raw: text });
      data = {};
    }
  } else {
    // Non‑JSON payload
    data = { raw: text };
  }

  if (!res.ok) throw new HttpError(res.status, data);
  return data as T;
}
