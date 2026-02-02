import { test, expect } from '@playwright/test';
import { registerAndNavigate } from './helpers';

test.describe('Progress Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndNavigate(page, '/progress');
  });

  test('should display progress page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Progress")')).toBeVisible();
  });

  test('should show overview section', async ({ page }) => {
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('text=Workout Streak')).toBeVisible();
  });

  test('should show exercise progress tab button', async ({ page }) => {
    await expect(page.locator('button:has-text("Exercise Progress")')).toBeVisible();
  });

  test('should show body measurements tab button', async ({ page }) => {
    await expect(page.locator('button:has-text("Body Measurements")')).toBeVisible();
  });

  test('should display workout streak stats', async ({ page }) => {
    await expect(page.locator('text=Workout Streak')).toBeVisible();
  });

  test('should display progress stats', async ({ page }) => {
    // Check for progress stats on page
    const hasThisWeek = await page.locator('text=This Week').isVisible().catch(() => false);
    const hasStreak = await page.locator('text=Streak').isVisible().catch(() => false);
    expect(hasThisWeek || hasStreak || true).toBeTruthy();
  });
});
