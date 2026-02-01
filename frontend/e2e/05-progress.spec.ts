import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to progress page
async function goToProgress(page: Page) {
  await page.goto('/progress');
  await page.waitForLoadState('networkidle');
}

test.describe('Progress Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display progress page', async ({ page }) => {
    await goToProgress(page);
    
    // Should see progress header
    await expect(page.locator('h1:has-text("Progress"), h2:has-text("Progress"), text=/progress|track/i').first()).toBeVisible();
  });

  test('should log body measurements', async ({ page }) => {
    await goToProgress(page);
    
    // Click log measurements button
    const logBtn = page.locator('button:has-text("Log"), button:has-text("Add Measurement"), [data-testid="log-measurement"]');
    await logBtn.first().click();
    
    // Fill weight
    const weightInput = page.locator('input[name="weight"], input[placeholder*="weight" i]');
    if (await weightInput.isVisible()) {
      await weightInput.fill('85');
    }
    
    // Fill other measurements if available
    const bodyFatInput = page.locator('input[name="bodyFat"], input[placeholder*="body fat" i]');
    if (await bodyFatInput.isVisible()) {
      await bodyFatInput.fill('15');
    }
    
    // Save
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Log")');
    await saveBtn.click();
    
    await page.waitForTimeout(500);
  });

  test('should view measurement history', async ({ page }) => {
    await goToProgress(page);
    
    // Should see history/chart
    const history = page.locator('text=/history|chart|trend/i, .chart, canvas, svg');
    await expect(history.first()).toBeVisible();
  });

  test('should log exercise progress (PR)', async ({ page }) => {
    await goToProgress(page);
    
    // Find exercise progress section
    const exerciseBtn = page.locator('button:has-text("Exercise"), a:has-text("Exercise"), text=/exercise progress/i');
    
    if (await exerciseBtn.first().isVisible()) {
      await exerciseBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Log a new PR
    const logPRBtn = page.locator('button:has-text("Log PR"), button:has-text("Log Progress"), button:has-text("Add")');
    
    if (await logPRBtn.first().isVisible()) {
      await logPRBtn.first().click();
      
      // Select exercise
      const exerciseSelect = page.locator('select[name="exercise"], input[placeholder*="exercise" i]');
      if (await exerciseSelect.isVisible()) {
        await exerciseSelect.fill('Bench Press');
      }
      
      // Enter weight
      const weightInput = page.locator('input[name="weight"], input[placeholder*="weight" i]');
      if (await weightInput.isVisible()) {
        await weightInput.fill('100');
      }
      
      // Enter reps
      const repsInput = page.locator('input[name="reps"], input[placeholder*="reps" i]');
      if (await repsInput.isVisible()) {
        await repsInput.fill('5');
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Log")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
    }
  });

  test('should create a fitness goal', async ({ page }) => {
    await goToProgress(page);
    
    // Find goals section
    const goalsBtn = page.locator('button:has-text("Goals"), a:has-text("Goals"), text=/goal/i');
    
    if (await goalsBtn.first().isVisible()) {
      await goalsBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Create new goal
    const addGoalBtn = page.locator('button:has-text("Add Goal"), button:has-text("New Goal"), button:has-text("Create")');
    
    if (await addGoalBtn.isVisible()) {
      await addGoalBtn.click();
      
      // Fill goal details
      const goalName = page.locator('input[name="name"], input[placeholder*="goal" i]');
      if (await goalName.isVisible()) {
        await goalName.fill('Bench Press 120kg');
      }
      
      const targetInput = page.locator('input[name="target"], input[placeholder*="target" i]');
      if (await targetInput.isVisible()) {
        await targetInput.fill('120');
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
      
      // Goal should appear
      await expect(page.locator('text=Bench Press 120kg')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view exercise progress chart', async ({ page }) => {
    await goToProgress(page);
    
    // Click on an exercise to view its progress
    const exerciseLink = page.locator('text=/bench|squat|deadlift/i').first();
    
    if (await exerciseLink.isVisible()) {
      await exerciseLink.click();
      await page.waitForTimeout(500);
      
      // Should see a chart or progress history
      const chart = page.locator('.chart, canvas, svg, [data-testid="progress-chart"]');
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should view overall stats', async ({ page }) => {
    await goToProgress(page);
    
    // Should see stats like total workouts, PRs, etc.
    const stats = page.locator('text=/total|workout|session|pr/i');
    await expect(stats.first()).toBeVisible();
  });
});
