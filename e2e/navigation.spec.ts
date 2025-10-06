import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to inspiration feed', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*inspiration/);
  });

  test('should navigate to providers page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Browse');
    await expect(page).toHaveURL(/.*providers/);
  });

  test('should navigate to forum page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Forum');
    await expect(page).toHaveURL(/.*forum/);
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Inspiration')).toBeVisible();
    await expect(page.locator('text=Forum')).toBeVisible();
  });

  test('should redirect to login for protected routes', async ({ page }) => {
    await page.goto('/profile/123');
    await expect(page).toHaveURL(/.*login/);
  });
});
