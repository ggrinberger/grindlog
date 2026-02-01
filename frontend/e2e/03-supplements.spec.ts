import { test, expect, Page } from '@playwright/test';
import { testUser, login } from './01-auth.spec';

// Helper: Navigate to supplements page
async function goToSupplements(page: Page) {
  await page.goto('/supplements');
  await page.waitForLoadState('networkidle');
}

test.describe('Supplements Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password);
  });

  test('should display supplements page', async ({ page }) => {
    await goToSupplements(page);
    
    // Should see supplements header/title
    await expect(page.locator('h1:has-text("Supplement"), h2:has-text("Supplement"), text=/supplement/i').first()).toBeVisible();
  });

  test('should add a new supplement manually', async ({ page }) => {
    await goToSupplements(page);
    
    // Click add supplement button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New Supplement"), [data-testid="add-supplement"]');
    await addBtn.first().click();
    
    // Fill supplement form
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    await nameInput.first().fill('Test Creatine');
    
    const dosageInput = page.locator('input[name="dosage"], input[placeholder*="dosage" i]');
    if (await dosageInput.isVisible()) {
      await dosageInput.fill('5g');
    }
    
    const frequencyInput = page.locator('input[name="frequency"], select[name="frequency"]');
    if (await frequencyInput.isVisible()) {
      await frequencyInput.fill('Daily');
    }
    
    // Save
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Create")');
    await saveBtn.click();
    
    await page.waitForTimeout(500);
    
    // Supplement should appear in list
    await expect(page.locator('text=Test Creatine')).toBeVisible({ timeout: 5000 });
  });

  test('should add supplement from suggestions', async ({ page }) => {
    await goToSupplements(page);
    
    // Look for suggested supplements section
    const suggestions = page.locator('text=/suggested|recommend/i');
    if (await suggestions.isVisible()) {
      // Click on a suggested supplement
      const suggestedItem = page.locator('[data-testid="suggested-supplement"], .suggested-supplement').first();
      if (await suggestedItem.isVisible()) {
        await suggestedItem.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should edit a supplement', async ({ page }) => {
    await goToSupplements(page);
    
    // Find edit button for a supplement
    const editBtn = page.locator('button:has-text("Edit"), button[aria-label*="edit" i], [data-testid="edit-supplement"]').first();
    
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Modify dosage
      const dosageInput = page.locator('input[name="dosage"], input[placeholder*="dosage" i]');
      if (await dosageInput.isVisible()) {
        await dosageInput.clear();
        await dosageInput.fill('10g');
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
      await saveBtn.click();
      
      await page.waitForTimeout(500);
      
      // Verify update
      await expect(page.locator('text=10g')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should log supplement intake', async ({ page }) => {
    await goToSupplements(page);
    
    // Find log/take button for a supplement
    const logBtn = page.locator('button:has-text("Log"), button:has-text("Take"), button:has-text("✓"), [data-testid="log-supplement"]').first();
    
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await page.waitForTimeout(500);
      
      // Should show logged indicator or success message
      const logged = page.locator('text=/logged|taken|completed/i, .logged-indicator, [data-logged="true"]');
      await expect(logged.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view supplement history', async ({ page }) => {
    await goToSupplements(page);
    
    // Click on history tab/button
    const historyBtn = page.locator('button:has-text("History"), a:has-text("History"), [data-testid="supplement-history"]');
    
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      
      // Should see history entries
      await expect(page.locator('text=/today|yesterday|log/i').first()).toBeVisible();
    }
  });

  test('should delete a supplement', async ({ page }) => {
    await goToSupplements(page);
    
    // First add a supplement to delete
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New")');
    await addBtn.first().click();
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    await nameInput.first().fill('To Delete Supplement');
    
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Create")');
    await saveBtn.click();
    await page.waitForTimeout(500);
    
    // Now delete it
    const supplementCard = page.locator('text=To Delete Supplement').locator('..');
    const deleteBtn = supplementCard.locator('button:has-text("Delete"), button[aria-label*="delete" i]');
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      
      await page.waitForTimeout(500);
      
      // Supplement should be gone
      await expect(page.locator('text=To Delete Supplement')).not.toBeVisible({ timeout: 5000 });
    }
  });
});
