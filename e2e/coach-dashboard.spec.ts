/**
 * E2E: Coach role-aware dashboard (sprint 3.12)
 *
 * Cubre:
 *  - Coach ve "Tus clases hoy" + "Asistencia hoy" + "Atletas en riesgo"
 *  - Coach NO ve elementos owner-only: "Ingresos rango", "Próxima facturación",
 *    "Tasa asistencia"
 *  - Owner sigue viendo el dashboard completo (regresión)
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function ensureOwnerHasActiveSub() {
  const tenantId = await getSeedBoxId();
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
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "ACTIVE" },
  });
}

test.describe.serial("Coach dashboard role-aware", () => {
  test.beforeAll(async () => {
    await ensureOwnerHasActiveSub();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("coach ve cards específicos del coach", async ({ page }) => {
    await loginAs(page, "coach");
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: /Tus clases hoy/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Asistencia hoy/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Atletas en riesgo/i }),
    ).toBeVisible();
  });

  test("coach NO ve elementos owner-only", async ({ page }) => {
    await loginAs(page, "coach");
    await page.goto("/admin");

    // Estos son del dashboard owner: KPI cards de ingresos + próxima facturación
    await expect(page.getByText(/Ingresos rango/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Próxima facturación/i }),
    ).toHaveCount(0);
    await expect(page.getByText(/Tasa asistencia/i)).toHaveCount(0);
  });

  test("owner sigue viendo dashboard completo (regresión)", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin");

    await expect(page.getByText(/Ingresos rango/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Próxima facturación/i }),
    ).toBeVisible();
  });
});
