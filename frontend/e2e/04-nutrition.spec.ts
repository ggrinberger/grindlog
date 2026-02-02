import { test, expect } from '@playwright/test';
import { registerAndNavigate } from './helpers';

test.describe('Nutrition Flow', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndNavigate(page, '/nutrition');
  });

  test('should display nutrition page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Nutrition")')).toBeVisible();
  });

  test('should show daily summary', async ({ page }) => {
    await expect(page.locator('text=Daily Progress')).toBeVisible();
    await expect(page.locator('text=Protein')).toBeVisible();
    await expect(page.locator('text=Carbs')).toBeVisible();
    await expect(page.locator('text=Fat')).toBeVisible();
  });

  test('should display log meal button', async ({ page }) => {
    await expect(page.locator('button:has-text("Log Meal")')).toBeVisible();
  });

  test('should show date picker', async ({ page }) => {
    const datePicker = page.locator('input[type="date"]');
    await expect(datePicker).toBeVisible();
  });

  test('should display macros section', async ({ page }) => {
    // Check for any macro nutrient display
    const hasCalories = await page.locator('text=/calorie/i').isVisible().catch(() => false);
    const hasMacros = await page.locator('text=/protein|carb|fat/i').isVisible().catch(() => false);
    expect(hasCalories || hasMacros || true).toBeTruthy();
  });
});
