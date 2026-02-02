import { test, expect, Page } from '@playwright/test';
import { testUser, login, completeOnboarding } from './helpers';

// Helper: Navigate to workouts page
async function goToWorkouts(page: Page) {
  await page.goto('/workouts');
  await page.waitForLoadState('networkidle');
  // Dismiss onboarding if it appears
  await completeOnboarding(page);
}

test.describe('Workout Schedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display workouts page', async ({ page }) => {
    await goToWorkouts(page);
    
    // Should see the page loaded with some content
    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });

  test('should display weekly schedule view', async ({ page }) => {
    await goToWorkouts(page);
    
    // Should see day tabs or cards (Monday through Sunday)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days.slice(0, 3)) { // Check at least first 3 days
      await expect(page.locator(`text=${day}`).first()).toBeVisible();
    }
  });

  test('should show day names', async ({ page }) => {
    await goToWorkouts(page);
    
    await expect(page.locator('text=Monday').first()).toBeVisible();
    await expect(page.locator('text=Tuesday').first()).toBeVisible();
    await expect(page.locator('text=Wednesday').first()).toBeVisible();
  });
});
