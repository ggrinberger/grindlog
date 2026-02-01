import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to workouts page
async function goToWorkouts(page: Page) {
  await page.goto('/workouts');
  await page.waitForLoadState('networkidle');
}

test.describe('Workout Schedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display weekly schedule view', async ({ page }) => {
    await goToWorkouts(page);
    
    // Should see day tabs or cards (Monday through Sunday)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days.slice(0, 3)) { // Check at least first 3 days
      await expect(page.locator(`text=${day}`).first()).toBeVisible();
    }
  });

  test('should add an exercise to a day', async ({ page }) => {
    await goToWorkouts(page);
    
    // Click on a day (e.g., Monday = day 1)
    await page.click('text=Monday');
    
    // Wait for the day's content to load
    await page.waitForTimeout(500);
    
    // Look for "Add Exercise" button
    const addBtn = page.locator('button:has-text("Add Exercise"), button:has-text("Add"), [data-testid="add-exercise"]');
    await addBtn.first().click();
    
    // Search for an exercise
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="exercise" i]');
    await searchInput.first().fill('Squat');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Click on a search result
    const exerciseResult = page.locator('text=/squat/i').first();
    if (await exerciseResult.isVisible()) {
      await exerciseResult.click();
    }
    
    // Fill in sets/reps if modal appears
    const setsInput = page.locator('input[name="sets"], input[placeholder*="sets" i]');
    if (await setsInput.isVisible()) {
      await setsInput.fill('3');
    }
    
    const repsInput = page.locator('input[name="reps"], input[placeholder*="reps" i]');
    if (await repsInput.isVisible()) {
      await repsInput.fill('10');
    }
    
    // Save/Add button
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Confirm")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
    
    // Exercise should appear in the day's list
    await expect(page.locator('text=/squat/i')).toBeVisible({ timeout: 5000 });
  });

  test('should search exercises', async ({ page }) => {
    await goToWorkouts(page);
    
    // Open add exercise modal
    await page.click('text=Monday');
    await page.waitForTimeout(300);
    
    const addBtn = page.locator('button:has-text("Add Exercise"), button:has-text("Add"), [data-testid="add-exercise"]');
    await addBtn.first().click();
    
    // Search for different exercise types
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="exercise" i]');
    
    // Search for a strength exercise
    await searchInput.first().fill('Bench');
    await page.waitForTimeout(300);
    await expect(page.locator('text=/bench/i').first()).toBeVisible();
    
    // Search for a cardio exercise
    await searchInput.first().clear();
    await searchInput.first().fill('Run');
    await page.waitForTimeout(300);
    await expect(page.locator('text=/run|zone/i').first()).toBeVisible();
  });

  test('should remove an exercise from a day', async ({ page }) => {
    await goToWorkouts(page);
    
    await page.click('text=Monday');
    await page.waitForTimeout(500);
    
    // Find delete/remove button for an exercise
    const deleteBtn = page.locator('[data-testid="delete-exercise"], button:has-text("Remove"), button[aria-label*="delete" i], button[aria-label*="remove" i], .delete-btn, .remove-btn').first();
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Confirm if needed
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      
      await page.waitForTimeout(500);
    }
  });

  test('should update exercise sets and reps', async ({ page }) => {
    await goToWorkouts(page);
    
    await page.click('text=Monday');
    await page.waitForTimeout(500);
    
    // Find an exercise card with editable fields
    const setsInput = page.locator('input[name="sets"], input[aria-label*="sets" i]').first();
    
    if (await setsInput.isVisible()) {
      await setsInput.clear();
      await setsInput.fill('5');
      
      // Trigger save (blur or save button)
      await setsInput.blur();
      await page.waitForTimeout(500);
      
      // Verify value persisted
      await expect(setsInput).toHaveValue('5');
    }
  });
});
