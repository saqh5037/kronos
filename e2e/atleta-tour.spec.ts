import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { disconnect, ensureDemoAthleteOnboarded } from "./fixtures/db";

const HOME_TOUR_KEY = "kronos_tour_home_v1";

/**
 * Regression guard for the "tour keeps insisting" bug: dismissing the tour
 * (X / backdrop / Escape) used to NOT persist, so TourAutoStart re-triggered it
 * on every navigation. The fix persists the seen-flag on ANY dismissal.
 */
test.describe("athlete onboarding tour", () => {
  test.beforeEach(async () => {
    await ensureDemoAthleteOnboarded();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("does not reappear after being dismissed", async ({ page }) => {
    // Fresh Playwright context = empty localStorage, so the home tour auto-starts.
    await loginAs(page, "atleta");
    await page.goto("/atleta");

    const closeBtn = page.getByRole("button", { name: "Cerrar tour" });
    // TourAutoStart polls for the [data-tour="home.hero"] anchor before starting.
    await expect(closeBtn).toBeVisible({ timeout: 8000 });

    await closeBtn.click();
    await expect(closeBtn).toBeHidden();

    // Core assertion: the dismissal persisted. This is exactly what was broken.
    const seenFlag = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      HOME_TOUR_KEY,
    );
    expect(seenFlag).not.toBeNull();

    // Behavioral confirmation: a full reload re-runs TourAutoStart, which must
    // read the seen-flag and NOT re-trigger the tour.
    await page.reload();
    await expect(page.getByTestId("streak-hero")).toBeVisible();
    // Give TourAutoStart its 300ms initial delay + a poll window to (not) fire.
    await page.waitForTimeout(1200);
    await expect(closeBtn).toBeHidden();
  });
});
