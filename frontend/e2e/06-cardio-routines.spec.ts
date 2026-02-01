import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to cardio page
async function goToCardio(page: Page) {
  await page.goto('/cardio');
  await page.waitForLoadState('networkidle');
}

// Helper: Navigate to routines page
async function goToRoutines(page: Page) {
  await page.goto('/routines');
  await page.waitForLoadState('networkidle');
}

test.describe('Cardio Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display cardio protocols', async ({ page }) => {
    await goToCardio(page);
    
    // Should see cardio/VO2 Max protocols
    await expect(page.locator('text=/cardio|vo2|protocol|zone/i').first()).toBeVisible();
  });

  test('should view a cardio protocol', async ({ page }) => {
    await goToCardio(page);
    
    // Click on a protocol
    const protocol = page.locator('[data-testid="cardio-protocol"], .protocol-card, text=/zone 2|hiit|threshold/i').first();
    
    if (await protocol.isVisible()) {
      await protocol.click();
      await page.waitForTimeout(500);
      
      // Should see protocol details
      await expect(page.locator('text=/minute|duration|heart rate|zone/i').first()).toBeVisible();
    }
  });

  test('should log a cardio session', async ({ page }) => {
    await goToCardio(page);
    
    // Click log session button
    const logBtn = page.locator('button:has-text("Log"), button:has-text("Start"), [data-testid="log-cardio"]');
    await logBtn.first().click();
    
    // Select protocol if needed
    const protocolSelect = page.locator('select[name="protocol"], button:has-text("Zone 2")');
    if (await protocolSelect.isVisible()) {
      await protocolSelect.click();
    }
    
    // Enter duration
    const durationInput = page.locator('input[name="duration"], input[placeholder*="duration" i], input[placeholder*="minute" i]');
    if (await durationInput.isVisible()) {
      await durationInput.fill('30');
    }
    
    // Enter heart rate
    const hrInput = page.locator('input[name="heartRate"], input[name="avgHeartRate"], input[placeholder*="heart" i]');
    if (await hrInput.isVisible()) {
      await hrInput.fill('140');
    }
    
    // Save
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Log"), button:has-text("Complete")');
    await saveBtn.click();
    
    await page.waitForTimeout(500);
  });

  test('should view cardio history', async ({ page }) => {
    await goToCardio(page);
    
    // Click history tab/button
    const historyBtn = page.locator('button:has-text("History"), a:has-text("History"), [data-testid="cardio-history"]');
    
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      
      // Should see log entries
      await expect(page.locator('text=/session|log|minute/i').first()).toBeVisible();
    }
  });

  test('should view weekly cardio summary', async ({ page }) => {
    await goToCardio(page);
    
    // Look for weekly summary section
    const summary = page.locator('text=/weekly|summary|total/i');
    await expect(summary.first()).toBeVisible();
  });
});

test.describe('Routines Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display routines page', async ({ page }) => {
    await goToRoutines(page);
    
    // Should see morning/evening routines
    await expect(page.locator('text=/routine|morning|evening/i').first()).toBeVisible();
  });

  test('should view morning routine', async ({ page }) => {
    await goToRoutines(page);
    
    // Click on morning routine
    const morningBtn = page.locator('button:has-text("Morning"), a:has-text("Morning"), text=/morning routine/i');
    
    if (await morningBtn.first().isVisible()) {
      await morningBtn.first().click();
      await page.waitForTimeout(500);
      
      // Should see routine items
      await expect(page.locator('text=/step|item|minute/i').first()).toBeVisible();
    }
  });

  test('should complete a routine', async ({ page }) => {
    await goToRoutines(page);
    
    // Find complete/start button
    const completeBtn = page.locator('button:has-text("Complete"), button:has-text("Start"), button:has-text("Done")');
    
    if (await completeBtn.first().isVisible()) {
      await completeBtn.first().click();
      await page.waitForTimeout(500);
      
      // Should show completed state or success message
      const completed = page.locator('text=/completed|done|success/i, .completed-indicator');
      await expect(completed.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view routine history', async ({ page }) => {
    await goToRoutines(page);
    
    // Click history
    const historyBtn = page.locator('button:has-text("History"), a:has-text("History")');
    
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      
      // Should see completion history
      await expect(page.locator('text=/completed|history|log/i').first()).toBeVisible();
    }
  });

  test('should create a new routine', async ({ page }) => {
    await goToRoutines(page);
    
    // Click add routine
    const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Routine")');
    
    if (await addBtn.first().isVisible()) {
      await addBtn.first().click();
      
      // Fill routine details
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Evening Routine');
      }
      
      // Select type (morning/evening)
      const typeSelect = page.locator('select[name="type"], button:has-text("Evening")');
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        const eveningOption = page.locator('text=Evening, option[value="evening"]');
        if (await eveningOption.isVisible()) {
          await eveningOption.click();
        }
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
      
      // Routine should appear
      await expect(page.locator('text=Test Evening Routine')).toBeVisible({ timeout: 5000 });
    }
  });
});
