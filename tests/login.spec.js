const { test, expect } = require('@playwright/test');

test.describe('SaaS Platform Login', () => {
  test('should allow user to successfully log into dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 's3cret');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify dashboard redirect
    await page.waitForNavigation({ timeout: 5000 });
    await expect(page.url()).toContain('/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('h1:has-text("Your Dashboard")')).toBeVisible();
    await expect(page.locator('.user-welcome:has-text("user@example.com")')).toBeVisible();
  });
});
