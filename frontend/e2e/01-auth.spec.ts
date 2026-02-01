import { test, expect, Page } from '@playwright/test';

// Unique user for each test run
const timestamp = Date.now();
const testUser = {
  email: `e2etest+${timestamp}@grindlog.test`,
  username: `e2euser${timestamp}`,
  password: 'TestPassword123!',
  displayName: 'E2E Test User',
};

// Helper: Login with credentials
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|workouts|onboarding)/);
}

// Helper: Logout
async function logout(page: Page) {
  // Look for logout button in header/nav
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('/login');
  }
}

test.describe('User Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    // Check for confirm password field
    const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(testUser.password);
    }
    
    // Optional: display name
    const displayName = page.locator('input[name="displayName"]');
    if (await displayName.isVisible()) {
      await displayName.fill(testUser.displayName);
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard, onboarding, or login
    await expect(page).toHaveURL(/\/(dashboard|onboarding|login|workouts)/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="username"]', `duplicate${timestamp}`);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(testUser.password);
    }
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/already|exists|taken/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await login(page, testUser.email, testUser.password);
    
    // Should be on authenticated page
    await expect(page).toHaveURL(/\/(dashboard|workouts|onboarding)/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=/invalid|incorrect|wrong|error/i')).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, testUser.email, testUser.password);
    await logout(page);
    
    // Should be on login page
    await expect(page).toHaveURL('/login');
  });
});

// Export test user for other test files
export { testUser, login, logout };
