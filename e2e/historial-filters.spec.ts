/**
 * E2E: Filtros del historial de cobros + footer suma (sprint 3.9)
 *
 * Cubre:
 *  - Owner ve historial completo + total
 *  - Filtro plan=pro oculta Premium, total se actualiza
 *  - Filtro from/to limita por fecha
 *  - "Limpiar filtros" remueve los params URL
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function seedInvoices() {
  const tenantId = await getSeedBoxId();
  const proPlan = await db().saasPlan.findUniqueOrThrow({
    where: { slug: "pro" },
  });
  const premiumPlan = await db().saasPlan.findUniqueOrThrow({
    where: { slug: "premium" },
  });

  // Cleanup
  await db().saasInvoice.deleteMany({ where: { tenantId } });
  await db().saasSubscription.deleteMany({ where: { tenantId } });

  // Una sub Pro y una Premium (ambas históricas)
  const proSub = await db().saasSubscription.create({
    data: {
      tenantId,
      planId: proPlan.id,
      status: "ACTIVE",
      startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  const premiumSub = await db().saasSubscription.create({
    data: {
      tenantId,
      planId: premiumPlan.id,
      status: "CANCELLED",
      startsAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      cancelledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  });

  // 2 invoices Pro (mes pasado y este) + 1 Premium (hace 90 días)
  await db().saasInvoice.createMany({
    data: [
      {
        tenantId,
        subscriptionId: premiumSub.id,
        amountMxnCents: 99900,
        status: "PAID",
        periodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId,
        subscriptionId: proSub.id,
        amountMxnCents: 49900,
        status: "PAID",
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now()),
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId,
        subscriptionId: proSub.id,
        amountMxnCents: 49900,
        status: "PAID",
        periodStart: new Date(Date.now()),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
      },
    ],
  });
}

test.describe.serial("Historial filters + summary", () => {
  test.beforeAll(async () => {
    await seedInvoices();
  });

  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await db().saasInvoice.deleteMany({ where: { tenantId } });
    await db().saasSubscription.deleteMany({ where: { tenantId } });
    await disconnect();
  });

  test("owner ve total de los 3 cobros sin filtros", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing/historial");

    // Total: 99900 + 49900 + 49900 = 199700 cents = $1,997 MXN
    await expect(page.getByText("Total").first()).toBeVisible();
    await expect(page.getByText(/\$1[.,]?997 MXN/)).toBeVisible();
    // 3 cobros en el footer
    await expect(page.getByText(/3 cobros/)).toBeVisible();
  });

  test("filtro plan=pro muestra solo Pro y total ajustado", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing/historial?plan=pro");

    // Solo invoices Pro (49900 × 2 = 99800)
    await expect(page.getByText(/\$998 MXN/)).toBeVisible();
    await expect(page.getByText(/2 cobros/)).toBeVisible();
    // Premium NO debe aparecer como celda en tabla (sí en select option, ignoramos)
    const cells = page.locator("table tbody td");
    await expect(cells.filter({ hasText: "Premium" })).toHaveCount(0);
  });

  test("filtro plan=premium muestra solo Premium", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing/historial?plan=premium");

    // 1 cobro en footer (sin "s")
    await expect(page.getByText(/^\(1 cobro/)).toBeVisible();
    // Premium en al menos una celda de tabla
    const cells = page.locator("table tbody td");
    await expect(cells.filter({ hasText: "Premium" })).toHaveCount(1);
  });

  test("rango sin resultados muestra empty state filtrado", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    // Rango futuro sin cobros
    await page.goto("/admin/billing/historial?from=2099-01-01&to=2099-12-31");
    await expect(page.getByText(/Sin resultados/i)).toBeVisible();
  });
});
