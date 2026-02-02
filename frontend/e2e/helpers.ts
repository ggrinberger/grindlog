import { Page } from '@playwright/test';

// Unique user for each test run
const timestamp = process.env.E2E_USER_SEED || Date.now().toString();

export const testUser = {
  email: `e2etest+${timestamp}@grindlog.test`,
  username: `e2euser${timestamp}`,
  password: 'TestPassword123!',
  displayName: 'E2E Test User',
};

// Helper: Login with credentials
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  if (page.url().includes('/login') && email === testUser.email) {
    await page.goto('/register');
    await page.fill('#email', testUser.email);
    await page.fill('#username', testUser.username);
    await page.fill('#displayName', testUser.displayName);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  
  await completeOnboarding(page);
}

// Helper: Complete onboarding wizard
export async function completeOnboarding(page: Page) {
  for (let attempt = 0; attempt < 10; attempt++) {
    // Check for modal
    const modal = page.locator('.fixed.inset-0.bg-slate-900\\/50').first();
    if (!await modal.isVisible({ timeout: 500 }).catch(() => false)) {
      return; // No modal, done
    }
    
    // Check what step we're on by looking for visible elements
    
    // Step 1: Profile - look for height/weight inputs
    const heightInput = page.locator('input[placeholder="175"]');
    if (await heightInput.isVisible({ timeout: 300 }).catch(() => false)) {
      await heightInput.fill('180');
      
      const weightInput = page.locator('input[placeholder="70"]');
      if (await weightInput.isVisible({ timeout: 300 }).catch(() => false)) {
        await weightInput.fill('80');
      }
      
      // Click goal button (Build Muscle)
      const goalBtn = page.locator('button:has-text("💪")').first();
      if (await goalBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await goalBtn.click();
        await page.waitForTimeout(100);
      }
      
      // Click experience (Intermediate)
      const expBtn = page.locator('button:has-text("Intermediate")').first();
      if (await expBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await expBtn.click();
        await page.waitForTimeout(100);
      }
      
      // Click Continue
      const continueBtn = page.locator('button:has-text("Continue"):not([disabled])');
      if (await continueBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        continue;
      }
    }
    
    // Step 2: Schedule - just click Continue or Skip
    const scheduleTitle = page.locator('text=Your Training Schedule');
    if (await scheduleTitle.isVisible({ timeout: 300 }).catch(() => false)) {
      const continueBtn = page.locator('button:has-text("Continue"):not([disabled])');
      if (await continueBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        continue;
      }
    }
    
    // Step 3: AI Preferences - need to click "No thanks" for both sections
    const workoutSection = page.locator('text=Workout Plan').first();
    if (await workoutSection.isVisible({ timeout: 300 }).catch(() => false)) {
      // Click "No thanks" for Workout Plan (first one)
      const workoutNoBtn = page.locator('.p-4.border-2:has-text("Workout Plan") button:has-text("No thanks")').first();
      if (await workoutNoBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await workoutNoBtn.click();
        await page.waitForTimeout(200);
      } else {
        // Fallback: try the first "No thanks" button
        const noThanksButtons = page.locator('button:has-text("No thanks")');
        if (await noThanksButtons.first().isVisible({ timeout: 300 }).catch(() => false)) {
          await noThanksButtons.first().click();
          await page.waitForTimeout(200);
        }
      }
      
      // Click "No thanks" for Nutrition Plan (second one)
      const nutritionNoBtn = page.locator('.p-4.border-2:has-text("Nutrition Plan") button:has-text("No thanks")').first();
      if (await nutritionNoBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await nutritionNoBtn.click();
        await page.waitForTimeout(200);
      } else {
        // Fallback: try the second "No thanks" button
        const noThanksButtons = page.locator('button:has-text("No thanks")');
        if (await noThanksButtons.nth(1).isVisible({ timeout: 300 }).catch(() => false)) {
          await noThanksButtons.nth(1).click();
          await page.waitForTimeout(200);
        }
      }
      
      // Now click Get Started
      const getStartedBtn = page.locator('button:has-text("Get Started"):not([disabled])');
      if (await getStartedBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await getStartedBtn.click();
        await page.waitForTimeout(500);
        continue;
      }
    }
    
    // If nothing worked, try pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

// Helper: Force close any modal by clicking Get Started with force
export async function forceCloseModal(page: Page) {
  for (let i = 0; i < 3; i++) {
    const modal = page.locator('.fixed.inset-0.bg-slate-900\\/50').first();
    if (!await modal.isVisible().catch(() => false)) {
      return;
    }
    
    // Try to click Get Started with force
    const getStarted = page.locator('button:has-text("Get Started")');
    if (await getStarted.isVisible().catch(() => false)) {
      await getStarted.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
    
    // Also try pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

// Helper: Register and navigate to target page
export async function registerAndNavigate(page: Page, targetPath: string) {
  const timestamp = Date.now();
  const user = { 
    username: `e2euser${timestamp}`, 
    email: `e2e${timestamp}@test.com`,
    password: 'TestPassword123!'
  };
  
  await page.goto('/register');
  await page.fill('input[name="username"], input[type="text"]', user.username);
  await page.fill('input[name="email"], input[type="email"]', user.email);
  const passwordFields = await page.locator('input[type="password"]').all();
  for (const field of passwordFields) {
    await field.fill(user.password);
  }
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(weekly-plan)?$/, { timeout: 10000 });
  
  // Complete onboarding
  await completeOnboarding(page);
  
  // Force close any remaining modal
  await forceCloseModal(page);
  
  // Navigate directly to target page
  if (targetPath !== '/' && !page.url().includes(targetPath)) {
    await page.goto(targetPath);
    await page.waitForLoadState('networkidle');
  }
  
  // Force close modal again after navigation
  await forceCloseModal(page);
  
  return user;
}

// Helper: Logout
export async function logout(page: Page) {
  await completeOnboarding(page);
  await forceCloseModal(page);
  
  const logoutBtn = page.locator('button:has-text("Logout")');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('/login');
  }
}

// Helper: Navigate to a page
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
