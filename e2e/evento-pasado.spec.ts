/**
 * E2E: past event detail shows closed state — regression for audit finding #16.
 *
 * Seed creates "dominus-murph-2026" with startDate 2026-05-23 (already past).
 * An athlete without an entry must see "Evento finalizado" — never the
 * QR-registration copy for an event that already happened.
 *
 * Requires: pnpm db:seed + dev server with NEXT_PUBLIC_DEV_LOGIN=1.
 */

import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Evento pasado — estado finalizado", () => {
  test("unregistered athlete sees closed state without QR copy", async ({
    page,
  }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta/eventos/dominus-murph-2026");

    await expect(page.getByText(/evento finalizado/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/escaneando el código QR/i)).toHaveCount(0);
    // Exit must exist: back link to events list
    await expect(
      page.getByRole("link", { name: /eventos/i }).first(),
    ).toBeVisible();
  });
});
