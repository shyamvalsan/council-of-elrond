import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('The Council of Elrond');
  });

  test('should show the chat input', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should show three response panels', async ({ page }) => {
    await page.goto('/');
    // Three column layout
    const panels = page.locator('[class*="rounded-lg border bg-card"]');
    await expect(panels).toHaveCount(3);
  });

  test('should have a sidebar with new chat button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('New Chat')).toBeVisible();
  });

  test('should have a stats footer bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Leaderboard')).toBeVisible();
  });
});
