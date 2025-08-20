
import { test, expect, request } from '@playwright/test';
const USER = process.env.POS_USER || 'eugene';

test('timeclock endpoints always return JSON (no empty bodies)', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });

  // status → JSON 200
  const s = await api.get(`/api/timeclock/status?userId=${encodeURIComponent(USER)}`);
  expect(s.headers()['content-type']).toContain('application/json');
  expect(s.status()).toBe(200);

  // clockin → 200/409, with JSON body
  const c = await api.post('/api/timeclock/clockin', { data: { userId: USER, stationId: 'front', role: 'cashier' } });
  expect(c.headers()['content-type']).toContain('application/json');
  expect([200, 409]).toContain(c.status());
});
