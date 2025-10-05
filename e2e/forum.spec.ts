import { test, expect } from '@playwright/test';

test.describe('Forum', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/forum');
  });

  test('should display forum page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('社群論壇');
  });

  test('should filter posts by category', async ({ page }) => {
    const categoryButton = page.locator('button:has-text("裝修問答")').first();
    await categoryButton.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(expect.any(Number));
  });

  test('should open post detail', async ({ page }) => {
    const firstPost = page.locator('[data-testid="post-card"]').first();
    await firstPost.click();
    await page.waitForURL(/\/forum\/post\/.+/);
    await expect(page.locator('h3')).toContainText('評論');
  });

  test('should create new post', async ({ page }) => {
    await page.click('button:has-text("新貼文")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    await page.fill('input[placeholder*="標題"]', 'Test Post Title');
    await page.fill('textarea[placeholder*="想法"]', 'Test post content');
    await page.click('button:has-text("發佈")');
    
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test Post Title')).toBeVisible();
  });

  test('should toggle view mode', async ({ page }) => {
    const gridButton = page.locator('button[aria-label="Grid view"]').first();
    const listButton = page.locator('button[aria-label="List view"]').first();
    
    await listButton.click();
    await expect(page.locator('[data-testid="post-grid"]')).toHaveClass(/space-y-6/);
    
    await gridButton.click();
    await expect(page.locator('[data-testid="post-grid"]')).toHaveClass(/grid/);
  });

  test('should load more posts on scroll', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="post-card"]').count();
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const newCount = await page.locator('[data-testid="post-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});
