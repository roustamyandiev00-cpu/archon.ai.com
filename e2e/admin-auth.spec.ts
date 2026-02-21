import { test, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

test.describe('Admin auth', () => {
  test('redirects unauthenticated users to /login when accessing /super-admin', async ({ page }) => {
    await page.goto(base + '/super-admin');
    // Expect redirect to /login (server may append query params)
    await expect(page).toHaveURL(new RegExp('/login'));
  });

  test('allows access when session cookie present', async ({ context, page }) => {
    const url = new URL(base);
    // Add a simple session cookie to simulate authenticated user
    await context.addCookies([{ name: 'session', value: 'e2e-dummy', domain: url.hostname, path: '/' }]);

    await page.goto(base + '/super-admin');
    // Should not be redirected to login
    await expect(page).not.toHaveURL(new RegExp('/login'));
  });
});
