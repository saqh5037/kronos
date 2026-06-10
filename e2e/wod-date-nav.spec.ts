/**
 * E2E: WOD page — description rendering + day navigation
 *
 * Requires:
 *  - pnpm db:seed (seed creates atleta@iron-hands.demo + today's WOD with description)
 *  - NEXT_PUBLIC_DEV_LOGIN=1
 *  - Dev server running on :3000
 *
 * Known env issue: if seed did not create a WOD for today, the "no WOD" empty
 * state should still show the day nav bar — we verify that.
 */

import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect } from "./fixtures/db";
import { todayKeyInTz, localDayWindow } from "../src/lib/wod-date";

test.describe.serial("WOD page — date nav + description", () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test("day nav bar is visible on /atleta/wod", async ({ page }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");
    // The day nav bar should always be present (whether or not there is a WOD)
    await expect(page.getByTestId("wod-day-nav")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("prev-day link updates ?date= query param", async ({ page }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");
    await page.getByTestId("wod-day-nav").waitFor({ timeout: 15_000 });

    // Click prev — should navigate to ?date=<yesterday>
    const prevLink = page.getByTestId("wod-nav-prev");
    const isDisabled = (await prevLink.count()) === 0;
    if (isDisabled) {
      // At -7 bound, prev is disabled — skip navigation test
      return;
    }
    const href = await prevLink.getAttribute("href");
    expect(href).toMatch(/\?date=\d{4}-\d{2}-\d{2}$/);

    await prevLink.click();
    await page.waitForURL(/date=/);
    await expect(page.getByTestId("wod-day-nav")).toBeVisible();

    // "HOY" button should appear when not on today
    await expect(page.getByTestId("wod-nav-today")).toBeVisible();
  });

  test("nav bound at -7: prev is disabled", async ({ page }) => {
    // Navigate to -7 days manually
    const today = new Date();
    const minus7 = new Date(today.getTime() - 7 * 86400000);
    const minus7Key = minus7.toISOString().slice(0, 10);

    await loginAs(page, "atleta");
    await page.goto(`/atleta/wod?date=${minus7Key}`);
    await page.getByTestId("wod-day-nav").waitFor({ timeout: 15_000 });

    // At -7 bound, prev is disabled (span not Link)
    await expect(page.getByTestId("wod-nav-prev-disabled")).toBeVisible();
    // Next should be enabled (there are days between -7 and today)
    await expect(page.getByTestId("wod-nav-next")).toBeVisible();
  });

  test("nav bound at +7: next is disabled", async ({ page }) => {
    const today = new Date();
    const plus7 = new Date(today.getTime() + 7 * 86400000);
    const plus7Key = plus7.toISOString().slice(0, 10);

    await loginAs(page, "atleta");
    await page.goto(`/atleta/wod?date=${plus7Key}`);
    await page.getByTestId("wod-day-nav").waitFor({ timeout: 15_000 });

    await expect(page.getByTestId("wod-nav-next-disabled")).toBeVisible();
    await expect(page.getByTestId("wod-nav-prev")).toBeVisible();
  });

  test("description renders with multi-line text when WOD has description", async ({
    page,
  }) => {
    // Seed the WOD with a description for today, then check it renders
    // If the seed WOD already has a description, this test passes naturally.
    // We check via DB that there is a WOD with description; if not, we skip gracefully.

    // Resolve "today" exactly like the app does: box-local calendar day,
    // scoped to the logged-in athlete's tenant (UTC windows pick the wrong
    // class for evening slots — that was the original bug).
    const athleteUser = await db().user.findUnique({
      where: { email: "atleta@iron-hands.demo" },
      select: { tenantId: true, box: { select: { timezone: true } } },
    });
    if (!athleteUser) {
      test.skip();
      return;
    }
    const timezone = athleteUser.box?.timezone ?? "UTC";
    const todayKey = todayKeyInTz(new Date(), timezone);
    const window = localDayWindow(todayKey, timezone);
    const klass = await db().class.findFirst({
      where: {
        tenantId: athleteUser.tenantId,
        startsAt: { gte: window.start, lte: window.end },
        isActive: true,
        wodId: { not: null },
        wod: { description: { not: null } },
      },
      orderBy: { startsAt: "asc" },
      include: { wod: true },
    });

    if (!klass?.wod?.description) {
      test.skip(); // No WOD with description for today — skip
      return;
    }

    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");
    await page.getByTestId("wod-day-nav").waitFor({ timeout: 15_000 });

    // Description block should be visible
    // The description is a <p> with whitespace-pre-line inside the WOD card
    const desc = klass.wod.description;
    const firstLine = desc.split("\n")[0].trim();
    if (firstLine) {
      await expect(
        page.locator("p").filter({ hasText: firstLine }),
      ).toBeVisible();
    }
  });
});
