import { test, expect } from '@playwright/test';

test.describe('Council Deliberation', () => {
  test('should show council configuration gear icon', async ({ page }) => {
    await page.goto('/');
    // The council panel should have a settings icon
    const settingsButtons = page.locator('button[aria-label="Council settings"]');
    await expect(settingsButtons).toBeVisible();
  });

  test('should open council config panel', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Council settings"]');
    await expect(page.getByText('Council Configuration')).toBeVisible();
  });

  test('should show default council members', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Council settings"]');
    await expect(page.getByText('Members (3/12, min 3)')).toBeVisible();
  });
});
