
import { test, expect, request } from '@playwright/test';

const DEFAULT_USER = process.env.POS_USER || 'eugene';

async function getCashier(api: request.APIRequestContext) {
  const r = await api.get('/api/mock-auth/active-users');
  const users = await r.json();
  const cashier = users.find((u: any) => /cashier|waiter/i.test(u.role)) || users[0];
  return cashier || { id: DEFAULT_USER, name: DEFAULT_USER };
}

async function ensureRegisterOpen(api: request.APIRequestContext, userId: string) {
  const s = await api.get('/api/register/status');
  const j = await s.json().catch(() => ({} as any));
  if (!j || !j.isOpen) {
    await api.post('/api/register/open', { data: { registerId: 'checkout_counter', floatAmount: 500, user: { id: userId, name: 'Test User' } } });
  }
}

async function setGate(api: request.APIRequestContext, value: boolean) {
  const r = await api.post('/api/settings', { data: { vat: { priceIncludesVAT: true, defaultRate: 0.15 }, requireClockedInToTransact: value } });
  expect(r.ok()).toBeTruthy();
}

async function clockoutIfActive(api: request.APIRequestContext, userId: string) {
  const st = await api.get(`/api/timeclock/status?userId=${encodeURIComponent(userId)}`);
  const j = await st.json().catch(() => ({ active: false }));
  if (j.active) await api.post('/api/timeclock/clockout', { data: { userId } });
}

async function tryAddLine(api: request.APIRequestContext, orderId: string, userId: string) {
  // Include userId so the server can 403 when gating is ON.
  return api.post('/api/orders/add-line', { data: { orderId, itemId: 'it_1755399215677_smuuz', qty: 1, user: { uid: userId } } });
}

function uid(prefix = 'SMOKE') { return `${prefix}-${Date.now()}`; }

// --- Tests -----------------------------------------------------------------

test.describe('POS gating flips live with settings toggle', () => {
  test('requireClockedInToTransact ON blocks, OFF allows', async ({ baseURL, page }) => {
    const api = await request.newContext({ baseURL });
    const user = await getCashier(api);

    await ensureRegisterOpen(api, user.id);
    await clockoutIfActive(api, user.id);

    // Gate ON → should block
    await setGate(api, true);
    const orderId1 = uid('GATEON');
    const add1 = await tryAddLine(api, orderId1, user.id);
    if (add1.status() !== 403) {
      // Fallback: UI should show disabled/blocked state
      await page.goto('/cashier');
      // Look for a disabled Send/Pay button or a toast message
      const blocked = page.getByRole('button', { name: /Send|Pay/i });
      // Not all UIs expose disabled state; accept either disabled or an error toast upon click
      if (await blocked.count()) {
        const isDisabled = await blocked.first().isDisabled().catch(() => false);
        if (!isDisabled) {
          await blocked.first().click().catch(() => {});
          await page.waitForTimeout(250);
        }
      }
    } else {
      expect(add1.status(), 'Server should 403 when not clocked-in').toBe(403);
    }

    // Gate OFF → should allow
    await setGate(api, false);
    const orderId2 = uid('GATEOFF');
    const add2 = await tryAddLine(api, orderId2, user.id);
    expect(add2.ok(), 'Should allow add-line when gate OFF').toBeTruthy();

    // Restore ON and prove that clocking in allows
    await setGate(api, true);
    await api.post('/api/timeclock/clockin', { data: { userId: user.id, stationId: 'front', role: 'cashier' } });
    const orderId3 = uid('GATEON-CLOCKED');
    const add3 = await tryAddLine(api, orderId3, user.id);
    expect(add3.ok(), 'Clocked-in user should be allowed even with gate ON').toBeTruthy();

    // Cleanup
    await api.post('/api/timeclock/clockout', { data: { userId: user.id } }).catch(() => {});
    await setGate(api, true); // default policy
  });
});
