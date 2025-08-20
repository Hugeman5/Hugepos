import { test, expect, request } from '@playwright/test';

test('verify works via dev origin (9000 → 6012 proxy)', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });
  const ok = await api.post('/api/mock-auth/verify', { data: { identifier: 'jwaiter', pin: '5678' } });
  expect(ok.status()).toBe(200);
  const bad = await api.post('/api/mock-auth/verify', { data: { identifier: 'jwaiter', pin: '0000' } });
  expect(bad.status()).toBe(401);
});
