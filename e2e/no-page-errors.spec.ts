import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

/**
 * Runtime-error floor for the athlete surface.
 *
 * Regression guard for the two P1 findings in
 * `docs/audit/2026-09-15-kronos-producto/reviews/technical-audit.md` §C:
 *
 *  1. `Rendered more hooks than during the previous render.` on
 *     `/atleta/wod/nuevo`, `/atleta/wod/foto`, `/atleta/programa` and
 *     `/atleta/onboarding` for box athletes. Those pages called
 *     `getBoxMode()` and then a server `redirect()` AFTER `atleta/layout.tsx`
 *     had already streamed its client shell (drawer, dynamic TabBar,
 *     NotificationBell, InstallPwaBanner), so React saw a different hook count
 *     across the transition. Fixed by resolving box mode once in the layout
 *     and rendering an in-place state instead of redirecting.
 *
 *     `/atleta/wod` and `/atleta/pagos` are the same bug in the OTHER
 *     direction: they redirected the PERSONAL-box athlete away. Both now
 *     render an in-place explanation too, so no `/atleta/**` page redirects on
 *     box mode any more.
 *
 *  2. `Hydration failed because the server rendered HTML didn't match the
 *     client` on `/atleta/perfil`, caused by `PushSubscribeButton` seeding
 *     `useState` from `Notification.permission` / `serviceWorker`.
 *
 * `atleta@iron-hands.demo` is a BOX athlete (Iron Hands, non-personal slug),
 * which is exactly the actor that reproduced both errors.
 */

const ROUTES = [
  "/atleta",
  "/atleta/perfil",
  "/atleta/programa",
  "/atleta/wod",
  "/atleta/wod/nuevo",
  "/atleta/wod/foto",
  "/atleta/pagos",
  "/atleta/onboarding",
] as const;

/** Console errors that prove a React tree-integrity failure. */
const CRITICAL_CONSOLE = /hooks|hydrat/i;

type Collected = {
  pageErrors: string[];
  criticalConsole: string[];
};

function collect(page: Page): Collected {
  const pageErrors: string[] = [];
  const criticalConsole: string[] = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CRITICAL_CONSOLE.test(text)) criticalConsole.push(text);
  });

  return { pageErrors, criticalConsole };
}

test.describe("athlete surface runtime errors", () => {
  test("box athlete browses every personal-box route with zero page errors", async ({
    page,
  }) => {
    const seen = collect(page);

    await loginAs(page, "atleta");

    for (const route of ROUTES) {
      seen.pageErrors.length = 0;
      seen.criticalConsole.length = 0;

      await page.goto(route, { waitUntil: "load", timeout: 60_000 });
      // Hydration and hook-order errors surface after the client tree settles,
      // not on `load`. Give React a beat to mount the streamed shell.
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
      await page.waitForTimeout(1_500);

      expect(
        seen.pageErrors,
        `uncaught page errors on ${route}:\n${seen.pageErrors.join("\n")}`,
      ).toEqual([]);

      expect(
        seen.criticalConsole,
        `hook-order / hydration console errors on ${route}:\n${seen.criticalConsole.join("\n")}`,
      ).toEqual([]);
    }
  });

  test("personal-box routes explain themselves instead of bouncing the athlete", async ({
    page,
  }) => {
    await loginAs(page, "atleta");

    for (const route of [
      "/atleta/programa",
      "/atleta/wod/nuevo",
      "/atleta/wod/foto",
    ]) {
      await page.goto(route, { waitUntil: "load", timeout: 60_000 });
      // No silent redirect: the athlete stays on the URL they tapped.
      expect(new URL(page.url()).pathname, `${route} redirected`).toBe(route);
      await expect(
        page.getByText(/atletas independientes/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    }
  });

  test("box-only routes keep the athlete on the URL they tapped", async ({
    page,
  }) => {
    // The mirror of the test above: `/atleta/wod` and `/atleta/pagos` used to
    // `redirect()` the PERSONAL-box athlete. A box athlete must simply get the
    // real page, on the same URL, with no bounce.
    await loginAs(page, "atleta");

    for (const route of ["/atleta/wod", "/atleta/pagos"]) {
      await page.goto(route, { waitUntil: "load", timeout: 60_000 });
      expect(new URL(page.url()).pathname, `${route} redirected`).toBe(route);
    }
  });

  test("the athlete surface exposes one main landmark and a skip link", async ({
    page,
  }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta", { waitUntil: "load", timeout: 60_000 });

    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /saltar al contenido/i }),
    ).toHaveCount(1);
  });
});
