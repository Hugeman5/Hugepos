import { test, expect, request } from '@playwright/test';

const EXPECT = ['eugene','jcashier','jwaiter'];

test('active-users returns quickly with expected IDs', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });
  const start = Date.now();
  const res = await api.get('/api/mock-auth/active-users');
  const ms = Date.now() - start;
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBeTruthy();
  for (const id of EXPECT) expect(body.map((u:any)=>u.id)).toContain(id);
  expect(ms).toBeLessThan(3000); // allow for dev infra
});
