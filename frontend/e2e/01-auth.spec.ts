import { test, expect } from '@playwright/test';
import { testUser, login } from './helpers';

test.describe('User Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form using id selectors that match the actual UI
    await page.fill('#email', testUser.email);
    await page.fill('#username', testUser.username);
    await page.fill('#displayName', testUser.displayName);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard (root /) or other authenticated pages
    await page.waitForURL((url) => {
      const path = url.pathname;
      return path === '/' || path.startsWith('/dashboard') || path.startsWith('/workouts') || path.startsWith('/onboarding');
    }, { timeout: 15000 });
  });

  test('should display register page elements', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('User Login Flow', () => {
  test('should display login page elements', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await login(page, testUser.email, testUser.password);
    
    // Should be on authenticated page (root / is dashboard)
    const path = new URL(page.url()).pathname;
    expect(path === '/' || path.startsWith('/dashboard') || path.startsWith('/workouts')).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'nonexistent@test.com');
    await page.fill('#password', 'WrongPassword123');
    await page.click('button[type="submit"]');
    
    // Should show error or stay on login page
    await page.waitForTimeout(2000);
    const stillOnLogin = page.url().includes('/login');
    expect(stillOnLogin).toBe(true);
  });
});
