
import { test, expect, request } from '@playwright/test';

const USER = process.env.POS_USER || 'eugene';
const PIN = process.env.POS_PIN || '5245';

async function ensureRegisterOpen(api: request.APIRequestContext) {
  const r = await api.get('/api/register/status');
  const j = await r.json().catch(() => ({} as any));
  if (!j || !j.isOpen) {
    await api.post('/api/register/open', { data: { userId: USER, floatAmount: 500 } });
  }
}

async function selectUserCard(page, userIdOrName: string) {
  // Strategy 1: data-testid
  const testId = page.locator(`[data-testid="user-card-${userIdOrName}"]`);
  if (await testId.count()) { await testId.first().click(); return; }
  // Strategy 2: role=button name=<user>
  const byName = page.getByRole('button', { name: new RegExp(`^${userIdOrName}$`, 'i') });
  if (await byName.count()) { await byName.first().click(); return; }
  // Strategy 3: text
  const byText = page.locator(`text=${userIdOrName}`);
  if (await byText.count()) { await byText.first().click(); return; }
  throw new Error('User card not found: ' + userIdOrName);
}

async function enterPin(page, pin: string) {
  // Strategy A: keypad buttons with data-testid
  const hasKey = await page.locator('[data-testid^="pin-key-"]').count();
  if (hasKey > 0) {
    for (const ch of pin.split('')) await page.locator(`[data-testid="pin-key-${ch}"]`).click();
    const submit = page.locator('[data-testid="pin-submit"], [data-testid="pin-enter"]');
    if (await submit.count()) await submit.first().click();
    return;
  }
  // Strategy B: buttons by text 0-9
  const anyDigitBtn = await page.getByRole('button', { name: /\b[0-9]\b/ }).count() > 0;
  if (anyDigitBtn) {
    for (const ch of pin.split('')) await page.getByRole('button', { name: new RegExp(`^${ch}$`) }).first().click();
    const enterBtn = page.getByRole('button', { name: /Enter|Login|Submit|↵/i });
    if (await enterBtn.count()) await enterBtn.first().click();
    return;
  }
  // Strategy C: direct input
  const input = page.locator('input[type="password"],[name="pin"],[data-testid="pin-input"]');
  if (await input.count()) {
    await input.first().fill(pin);
    await page.keyboard.press('Enter');
    return;
  }
  throw new Error('PIN input method not found');
}

test.describe('Register → POS → KDS (UI)', () => {
  test.beforeAll(async ({ baseURL }) => {
    if (!baseURL) throw new Error("baseURL is not configured");
    const api = await request.newContext({ baseURL });
    await ensureRegisterOpen(api);
  });

  test('Login via PIN keypad routes by role', async ({ page }) => {
    await page.goto('/login-staff');
    await selectUserCard(page, USER);
    await enterPin(page, PIN);
    await expect(page).toHaveURL(/\/(admin|pos|kds|waiter|cashier)(\/.*)?$/);
  });

  test('Create and send order; KDS receives it', async ({ page, request: apiContext }) => {
    // Assume we are authenticated from previous test; go to POS if needed
    await page.goto('/cashier');
    // If UI add-to-cart selector is known, click it; otherwise fall back to API to ensure flow works
    const orderId = `E2E-${Date.now()}`;
    const add = await apiContext.post('/api/orders/add-line', { data: { orderId, itemId: 'it_1755399215677_smuuz', qty: 1 } });
    expect(add.ok()).toBeTruthy();
    
    const addedData = await add.json();
    const serverOrderId = addedData.order.id;

    const send = await apiContext.post('/api/orders/send', { data: { orderId: serverOrderId } });
    expect(send.ok()).toBeTruthy();

    const kds = await apiContext.get('/api/kds');
    const text = await kds.text();
    expect(text).toContain(serverOrderId);

    await page.goto('/kds');
    await expect(page.locator(`text=Order #${addedData.order.ticketNo}`)).toBeVisible();
  });
});
