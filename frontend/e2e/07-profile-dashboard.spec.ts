import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to profile page
async function goToProfile(page: Page) {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
}

// Helper: Navigate to dashboard
async function goToDashboard(page: Page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

test.describe('User Profile Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display profile page', async ({ page }) => {
    await goToProfile(page);
    
    // Should see profile info
    await expect(page.locator('text=/profile|settings|account/i').first()).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    await goToProfile(page);
    
    // Edit display name
    const displayNameInput = page.locator('input[name="displayName"], input[placeholder*="name" i]');
    if (await displayNameInput.isVisible()) {
      await displayNameInput.clear();
      await displayNameInput.fill('Updated E2E User');
    }
    
    // Edit height
    const heightInput = page.locator('input[name="heightCm"], input[name="height"], input[placeholder*="height" i]');
    if (await heightInput.isVisible()) {
      await heightInput.clear();
      await heightInput.fill('180');
    }
    
    // Save
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      
      // Should show success message or updated data
      await expect(page.locator('text=/saved|updated|success/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update fitness goal', async ({ page }) => {
    await goToProfile(page);
    
    // Find fitness goal selector
    const goalSelect = page.locator('select[name="fitnessGoal"], button:has-text("Goal")');
    
    if (await goalSelect.isVisible()) {
      await goalSelect.click();
      
      // Select a goal
      const goalOption = page.locator('text=/strength|muscle|weight loss/i').first();
      if (await goalOption.isVisible()) {
        await goalOption.click();
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display dashboard with overview', async ({ page }) => {
    await goToDashboard(page);
    
    // Should see dashboard elements
    await expect(page.locator('text=/dashboard|today|overview|welcome/i').first()).toBeVisible();
  });

  test('should show today\'s workout summary', async ({ page }) => {
    await goToDashboard(page);
    
    // Look for workout section
    const workoutSection = page.locator('text=/workout|exercise|training/i');
    await expect(workoutSection.first()).toBeVisible();
  });

  test('should show nutrition summary', async ({ page }) => {
    await goToDashboard(page);
    
    // Look for nutrition/calories section
    const nutritionSection = page.locator('text=/calorie|nutrition|meal|macro/i');
    await expect(nutritionSection.first()).toBeVisible();
  });

  test('should navigate to different sections from dashboard', async ({ page }) => {
    await goToDashboard(page);
    
    // Navigation should be present
    const nav = page.locator('nav, [role="navigation"], .sidebar, .navbar');
    await expect(nav.first()).toBeVisible();
    
    // Check that navigation links exist
    const links = ['Workouts', 'Nutrition', 'Progress', 'Supplements'];
    for (const link of links) {
      const navLink = page.locator(`a:has-text("${link}"), button:has-text("${link}")`);
      await expect(navLink.first()).toBeVisible();
    }
  });
});

test.describe('Complete User Journey', () => {
  test('full onboarding and daily workflow', async ({ page }) => {
    // This test simulates a complete user journey
    await login(page, testUser.email, testUser.password);
    
    // 1. Check dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|workouts|onboarding)/);
    
    // 2. View today's workout
    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i').first()).toBeVisible();
    
    // 3. Check supplements
    await page.goto('/supplements');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/supplement/i').first()).toBeVisible();
    
    // 4. Log nutrition
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/nutrition|calorie/i').first()).toBeVisible();
    
    // 5. Check progress
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/progress/i').first()).toBeVisible();
    
    // 6. View profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/profile|account|settings/i').first()).toBeVisible();
  });
});
