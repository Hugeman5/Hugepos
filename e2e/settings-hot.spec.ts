
import { test, expect, request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

async function readSettings() {
  try { return JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf8')); }
  catch { 
    // This fallback should match the structure of the settings object
    return { 
        vat: { priceIncludesVAT: true }, 
        rounding: { cashRounding: false } 
    }; 
  }
}

async function writeSettings(data: any) {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  const tmp = SETTINGS_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, SETTINGS_PATH);
}

test.describe('Settings hot-read without restart', () => {
  test('UI reflects settings.json changes after file edit', async ({ page, baseURL }) => {
    // This test assumes a logged-in state or public settings page
    // For HugePOS, the admin settings page is relevant
    await page.goto('/admin/settings');
    
    // 1. Get original settings state from the file
    const originalSettings = await readSettings();
    const originalVatSetting = originalSettings.vat.priceIncludesVAT;

    try {
        // 2. Flip the value in the file
        const flippedSettings = { 
            ...originalSettings, 
            vat: { ...originalSettings.vat, priceIncludesVAT: !originalVatSetting }
        };
        await writeSettings(flippedSettings);

        // 3. Reload the page to force the Next.js server to re-read the file
        await page.reload();
        
        // 4. Check the API reflects the change instantly
        const api = await request.newContext({ baseURL });
        const apiSettings = await api.get('/api/settings').then(r => r.json());
        expect(apiSettings.vat.priceIncludesVAT).toBe(!originalVatSetting);

        // 5. Assert that the UI toggle now shows the flipped state
        const toggle = page.locator('#priceIncludesVAT');
        await expect(toggle).toHaveAttribute('data-state', !originalVatSetting ? 'checked' : 'unchecked');

    } finally {
        // 7. Cleanup: restore original settings file
        await writeSettings(originalSettings);
    }
  });
});
