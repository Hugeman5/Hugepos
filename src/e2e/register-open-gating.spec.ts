
import { test, expect, request } from '@playwright/test';

const USER = process.env.POS_USER || 'eugene';

test.describe('Register open requires clock-in', () => {
  test('API gate: 403 when clocked-out; success or 409 when clocked-in', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });

    // Ensure register is closed to start fresh
    const statusRes = await api.get('/api/register/status');
    if (statusRes.ok()) {
        const status = await statusRes.json();
        if (status.state === 'OPEN') {
            await api.post('/api/register/close', { data: { userId: USER, declaredCash: 500 }});
        }
    }
    
    // Ensure clocked-out
    await api.post('/api/timeclock/clockout', { data: { userId: USER } }).catch(() => {});

    // Attempt open → expect 403
    const r1 = await api.post('/api/register/open', { data: { userId: USER, userName: 'E2E Test', registerId: 'checkout_counter', openingFloat: 500 } });
    expect(r1.status()).toBe(403);
    const body1 = await r1.json();
    expect(body1.error).toBe('NOT_CLOCKED_IN');
    

    // Clock-in, then open should work or be already open
    await api.post('/api/timeclock/clockin', { data: { userId: USER, stationId: 'front', role: 'cashier' } });
    const r2 = await api.post('/api/register/open', { data: { userId: USER, userName: 'E2E Test', registerId: 'checkout_counter', openingFloat: 500 } });
    expect(r2.status()).toBe(200);

    // Attempting to open again should fail with 409
    const r3 = await api.post('/api/register/open', { data: { userId: USER, userName: 'E2E Test', registerId: 'checkout_counter', openingFloat: 500 } });
    expect(r3.status()).toBe(409);
    const body3 = await r3.json();
    expect(body3.error).toBe('REGISTER_ALREADY_OPEN');

    // Cleanup: close register and clock out
    await api.post('/api/register/close', { data: { userId: USER, declaredCash: 500 }});
    await api.post('/api/timeclock/clockout', { data: { userId: USER } }).catch(() => {});

  });
});
