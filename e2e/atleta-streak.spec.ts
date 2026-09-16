import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import {
  disconnect,
  ensureDemoAthleteOnboarded,
  setDemoAthleteAttendanceOn,
  setDemoAthleteAttendanceStreak,
} from "./fixtures/db";

/**
 * Regression guard for the "phantom streak" bug: the athlete home read the raw
 * cached `Streak.count` and showed it forever, even with no recent attendance.
 *
 * The fix went further than the read-time gate this spec was written against —
 * `getAthleteHome` now recomputes the streak from the ATTENDED bookings and
 * ignores the cached row entirely. Writing only the cache therefore proved
 * nothing: the spec passed and failed for reasons unrelated to the bug. It now
 * drives the bookings (the real source) AND leaves a contradicting cached row
 * in place, so a regression that starts trusting the cache again fails here.
 */
test.describe.serial("athlete home — attendance streak", () => {
  let restore: (() => Promise<void>) | null = null;

  test.beforeEach(async () => {
    await ensureDemoAthleteOnboarded();
  });

  test.afterEach(async () => {
    if (restore) {
      await restore();
      restore = null;
    }
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("shows 0 when there is no recent attendance, whatever the cache says", async ({
    page,
  }) => {
    // No attendance inside the 1-day grace…
    restore = await setDemoAthleteAttendanceOn([]);
    // …while the cache still claims a live 5-day streak from five days ago.
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await setDemoAthleteAttendanceStreak(5, fiveDaysAgo);

    await loginAs(page, "atleta");
    await page.goto("/atleta");

    const hero = page.getByTestId("streak-hero");
    await expect(hero).toBeVisible();
    // count === 0 → StreakHero renders the "dormant" status. If the cache leaked
    // back in, the 5 would render and status would be safe/warning/critical.
    await expect(hero).toHaveAttribute("data-status", "dormant");
    await expect(hero.getByText("0", { exact: true })).toBeVisible();
  });

  test("shows the real count when the streak is current (attended today)", async ({
    page,
  }) => {
    // Today, yesterday and the day before → a 3-day streak, computed.
    restore = await setDemoAthleteAttendanceOn([0, 1, 2]);
    // The cache disagrees on purpose: it must not be what gets rendered.
    await setDemoAthleteAttendanceStreak(99, new Date());

    await loginAs(page, "atleta");
    await page.goto("/atleta");

    const hero = page.getByTestId("streak-hero");
    await expect(hero).toBeVisible();
    await expect(hero).not.toHaveAttribute("data-status", "dormant");
    await expect(hero.getByText("3", { exact: true })).toBeVisible();
    await expect(hero.getByText("99", { exact: true })).toHaveCount(0);
  });
});
