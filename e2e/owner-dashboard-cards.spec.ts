/**
 * E2E: Owner-focused cards en /admin (sprint 3.6)
 *
 * Cubre:
 *  - Owner ve "Atletas en riesgo" + "Próxima facturación"
 *  - Coach NO ve los cards (son OWNER-only)
 *  - Card "Próxima facturación" muestra monto + plan + días si hay sub ACTIVE
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function ensureActiveSubscription() {
  const tenantId = await getSeedBoxId();
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "ACTIVE" },
  });
  const existing = await db().saasSubscription.findFirst({
    where: { tenantId, status: "ACTIVE" },
  });
  if (existing) return;
  const plan = await db().saasPlan.findUniqueOrThrow({
    where: { slug: "pro" },
  });
  await db().saasSubscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

test.describe.serial("Owner dashboard cards", () => {
  test.beforeAll(async () => {
    await ensureActiveSubscription();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("owner ve cards Atletas en riesgo + Próxima facturación", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: /Atletas en riesgo/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Próxima facturación/i }),
    ).toBeVisible();
    // El monto del plan Pro
    await expect(page.getByText(/\$499 MXN/).first()).toBeVisible();
  });

  test("coach NO ve cards owner-only", async ({ page }) => {
    await loginAs(page, "coach");
    await page.goto("/admin");

    // Esperar que el dashboard cargue
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /Próxima facturación/i }),
    ).toHaveCount(0);
  });
});
