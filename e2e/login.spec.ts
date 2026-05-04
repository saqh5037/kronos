/**
 * TDD RED: Auth login flow — these tests MUST FAIL before implementation.
 *
 * Tests:
 * 1. Login page renders and is reachable
 * 2. Unauthenticated access to /admin redirects to /login
 * 3. Unauthenticated access to /atleta redirects to /login
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("login page renders at /login", async ({ page }) => {
    await page.goto("/login");
    // Should show Kronos logo/wordmark
    await expect(page).toHaveTitle(/Kronos/);
    // Should show the email magic link input
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("unauthenticated access to /admin redirects to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated access to /atleta redirects to /login", async ({
    page,
  }) => {
    await page.goto("/atleta");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated access to /tv is allowed (public screen)", async ({
    page,
  }) => {
    await page.goto("/tv");
    // TV screen is public — should not redirect to login
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator("body")).toBeVisible();
  });
});
