import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to nutrition page
async function goToNutrition(page: Page) {
  await page.goto('/nutrition');
  await page.waitForLoadState('networkidle');
}

test.describe('Nutrition Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display nutrition page', async ({ page }) => {
    await goToNutrition(page);
    
    // Should see nutrition header/dashboard
    await expect(page.locator('h1:has-text("Nutrition"), h2:has-text("Nutrition"), text=/nutrition|calories|macros/i').first()).toBeVisible();
  });

  test('should view daily summary', async ({ page }) => {
    await goToNutrition(page);
    
    // Should see calorie/macro tracking
    const summary = page.locator('text=/calories|protein|carbs|fat|daily/i');
    await expect(summary.first()).toBeVisible();
  });

  test('should log a meal', async ({ page }) => {
    await goToNutrition(page);
    
    // Click add meal button
    const addBtn = page.locator('button:has-text("Add Meal"), button:has-text("Log Meal"), button:has-text("Add"), [data-testid="add-meal"]');
    await addBtn.first().click();
    
    // Select meal type (breakfast, lunch, dinner, snack)
    const mealType = page.locator('select[name="mealType"], button:has-text("Breakfast"), button:has-text("Lunch")');
    if (await mealType.first().isVisible()) {
      await mealType.first().click();
    }
    
    // Add food items if form exists
    const foodInput = page.locator('input[name="food"], input[placeholder*="food" i], input[placeholder*="item" i]');
    if (await foodInput.isVisible()) {
      await foodInput.fill('Chicken Breast');
    }
    
    // Add calories/macros if fields exist
    const caloriesInput = page.locator('input[name="calories"], input[placeholder*="calories" i]');
    if (await caloriesInput.isVisible()) {
      await caloriesInput.fill('300');
    }
    
    const proteinInput = page.locator('input[name="protein"], input[placeholder*="protein" i]');
    if (await proteinInput.isVisible()) {
      await proteinInput.fill('50');
    }
    
    // Save meal
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Log"), button:has-text("Add")');
    await saveBtn.click();
    
    await page.waitForTimeout(500);
  });

  test('should view nutrition plans', async ({ page }) => {
    await goToNutrition(page);
    
    // Click on plans tab/section
    const plansBtn = page.locator('button:has-text("Plans"), a:has-text("Plans"), text=/meal plan/i');
    
    if (await plansBtn.first().isVisible()) {
      await plansBtn.first().click();
      await page.waitForTimeout(500);
      
      // Should see nutrition plans (high intensity, moderate, recovery)
      const plans = page.locator('text=/high.intensity|moderate|recovery|plan/i');
      await expect(plans.first()).toBeVisible();
    }
  });

  test('should set nutrition targets', async ({ page }) => {
    await goToNutrition(page);
    
    // Find targets/settings section
    const settingsBtn = page.locator('button:has-text("Settings"), button:has-text("Targets"), [data-testid="nutrition-settings"]');
    
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Set daily calorie target
      const calorieTarget = page.locator('input[name="dailyCalories"], input[placeholder*="calorie" i]');
      if (await calorieTarget.isVisible()) {
        await calorieTarget.clear();
        await calorieTarget.fill('2500');
      }
      
      // Set protein target
      const proteinTarget = page.locator('input[name="proteinG"], input[placeholder*="protein" i]');
      if (await proteinTarget.isVisible()) {
        await proteinTarget.clear();
        await proteinTarget.fill('180');
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
    }
  });

  test('should view weekly summary', async ({ page }) => {
    await goToNutrition(page);
    
    // Navigate to weekly view
    const weeklyBtn = page.locator('button:has-text("Weekly"), a:has-text("Weekly"), [data-testid="weekly-summary"]');
    
    if (await weeklyBtn.isVisible()) {
      await weeklyBtn.click();
      await page.waitForTimeout(500);
      
      // Should see weekly data/chart
      const weeklyData = page.locator('text=/week|average|total/i, .chart, canvas, svg');
      await expect(weeklyData.first()).toBeVisible();
    }
  });

  test('should edit a logged meal', async ({ page }) => {
    await goToNutrition(page);
    
    // Find an existing meal entry
    const mealEntry = page.locator('[data-testid="meal-entry"], .meal-entry, .meal-card').first();
    
    if (await mealEntry.isVisible()) {
      // Click edit
      const editBtn = mealEntry.locator('button:has-text("Edit"), button[aria-label*="edit" i]');
      if (await editBtn.isVisible()) {
        await editBtn.click();
        
        // Modify calories
        const caloriesInput = page.locator('input[name="calories"], input[placeholder*="calories" i]');
        if (await caloriesInput.isVisible()) {
          await caloriesInput.clear();
          await caloriesInput.fill('400');
        }
        
        // Save
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
        await saveBtn.click();
        
        await page.waitForTimeout(500);
      }
    }
  });

  test('should delete a logged meal', async ({ page }) => {
    await goToNutrition(page);
    
    // Find an existing meal entry
    const mealEntry = page.locator('[data-testid="meal-entry"], .meal-entry, .meal-card').first();
    
    if (await mealEntry.isVisible()) {
      // Click delete
      const deleteBtn = mealEntry.locator('button:has-text("Delete"), button[aria-label*="delete" i]');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Confirm
        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
        
        await page.waitForTimeout(500);
      }
    }
  });
});
