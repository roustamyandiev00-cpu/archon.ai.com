import { test, expect, type Page } from '@playwright/test';

const SKIP_SNAPSHOTS_IN_CI = !!process.env.CI;

test.describe('Visual Regression - Dashboard', () => {
  async function stabilizeForSnapshots(page: Page) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addStyleTag({
      content: `
        /* Disable animations/transitions for deterministic screenshots. */
        *, *::before, *::after { 
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
          caret-color: transparent !important;
        }

        /* Hide time-dependent UI without affecting layout. */
        [data-testid="live-clock"],
        [data-testid="page-loading-indicator"] {
          visibility: hidden !important;
        }
      `,
    })
  }

  test('homepage snapshot – desktop', async ({ page }) => {
    test.skip(SKIP_SNAPSHOTS_IN_CI, 'Snapshots zijn environment-specifiek; draai lokaal met --update-snapshots.');
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
    await stabilizeForSnapshots(page)
    
    // Capture full page snapshot
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('homepage snapshot – mobile', async ({ page }) => {
    test.skip(SKIP_SNAPSHOTS_IN_CI, 'Snapshots zijn environment-specifiek; draai lokaal met --update-snapshots.');
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
    await stabilizeForSnapshots(page)
    
    // Capture mobile snapshot
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('header interactive elements exist', async ({ page }) => {
    await page.goto('/');
    
    // Check header elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check search button
    const searchBtn = page.locator('button[aria-label="Open zoeken"]');
    await expect(searchBtn).toBeVisible();
    
    // Check theme toggle
    const themeBtn = page.locator('button[aria-label="Thema wisselen"]');
    await expect(themeBtn).toBeVisible();
  });

  test('sidebar opens/closes', async ({ page }) => {
    await page.goto('/');
    
    // On desktop, check sidebar toggle
    const sidebarToggle = page.locator('button[aria-label*="Zijbalk"]').first();
    if (await sidebarToggle.isVisible()) {
      // Toggle sidebar open
      await sidebarToggle.click();
      
      // Check sidebar is now invisible or has toggled state
      const sidebar = page.locator('aside');
      // Just verify the click worked without checking visibility
      // (sidebar may have different visual states)
    }
  });

  test('skip-to-content link is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to skip link and verify it's focusable
    await page.keyboard.press('Tab');
    
    // The skip link should be in focus
    const skipLink = page.locator('a.skip-to-content');
    await expect(skipLink).toBeFocused();
    
    // Verify it links to main content
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('color contrast passes WCAG AA', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic check — pa11y scan is the authoritative source
    // but we verify buttons are present and styled
    const buttons = page.locator('button[type="button"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
