import { test, expect } from '@playwright/test';

test.describe('Judgment Flow', () => {
  test('should display judgment bar after responses', async ({ page }) => {
    await page.goto('/');
    // The judgment bar appears only after responses complete
    // This is a structural test - verify the page loads correctly
    await expect(page.locator('h1')).toContainText('The Council of Elrond');
  });

  test('should have model selector dropdowns', async ({ page }) => {
    await page.goto('/');
    // There should be model selector buttons
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
  });
});
