import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import {
  disconnect,
  ensureDemoAthleteOnboarded,
  setDemoAthleteAttendanceStreak,
} from "./fixtures/db";

/**
 * Regression guard for the "phantom streak" bug: the athlete home read the raw
 * cached `Streak.count` and showed it forever, even with no recent attendance.
 * The fix gates the count at read time with `isStreakCurrent(lastEventAt, now)`.
 */
test.describe("athlete home — attendance streak", () => {
  test.beforeEach(async () => {
    await ensureDemoAthleteOnboarded();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("shows 0 when the cached streak is stale (no recent attendance)", async ({
    page,
  }) => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await setDemoAthleteAttendanceStreak(5, fiveDaysAgo);

    await loginAs(page, "atleta");
    await page.goto("/atleta");

    const hero = page.getByTestId("streak-hero");
    await expect(hero).toBeVisible();
    // count === 0 → StreakHero renders the "dormant" status. If the gate were
    // broken the cached 5 would render and status would be safe/warning/critical.
    await expect(hero).toHaveAttribute("data-status", "dormant");
    await expect(hero.getByText("0", { exact: true })).toBeVisible();
  });

  test("shows the real count when the streak is current (event today)", async ({
    page,
  }) => {
    await setDemoAthleteAttendanceStreak(3, new Date());

    await loginAs(page, "atleta");
    await page.goto("/atleta");

    const hero = page.getByTestId("streak-hero");
    await expect(hero).toBeVisible();
    await expect(hero).not.toHaveAttribute("data-status", "dormant");
    await expect(hero.getByText("3", { exact: true })).toBeVisible();
  });
});
