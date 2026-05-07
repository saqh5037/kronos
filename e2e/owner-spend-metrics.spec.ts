/**
 * E2E: Owner SaaS spend metrics card en /admin/billing (sprint 3.11)
 *
 * Cubre:
 *  - Owner con sub Pro ACTIVE + 3 invoices históricas ve:
 *    - "Tu gasto en Kronos"
 *    - $499 MXN como mensual
 *    - $5,988 MXN como ARR proyectado
 *    - $1,497 MXN como total pagado
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function seedSpend() {
  const tenantId = await getSeedBoxId();
  await db().saasInvoice.deleteMany({ where: { tenantId } });
  await db().saasSubscription.deleteMany({ where: { tenantId } });

  const plan = await db().saasPlan.findUniqueOrThrow({
    where: { slug: "pro" },
  });
  const sub = await db().saasSubscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  // 3 invoices históricas (3 × $499 = $1,497)
  await db().saasInvoice.createMany({
    data: [0, 30, 60].map((daysAgo) => ({
      tenantId,
      subscriptionId: sub.id,
      amountMxnCents: 49900,
      status: "PAID" as const,
      periodStart: new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    })),
  });
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "ACTIVE" },
  });
}

test.describe.serial("Owner spend metrics", () => {
  test.beforeAll(async () => {
    await seedSpend();
  });

  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await db().saasInvoice.deleteMany({ where: { tenantId } });
    await db().saasSubscription.deleteMany({ where: { tenantId } });
    await disconnect();
  });

  test("owner ve métricas de gasto en /admin/billing", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing");

    await expect(
      page.getByRole("heading", { name: /Tu gasto en Kronos/i }),
    ).toBeVisible({ timeout: 10_000 });
    // MRR (4 ocurrencias posibles: card, KCard plan actual, etc.)
    await expect(page.getByText(/\$499 MXN/).first()).toBeVisible();
    // ARR proyectado: $5,988 MXN (formato es-MX usa coma o punto)
    await expect(page.getByText(/\$5[,.]988 MXN/)).toBeVisible();
    // Total pagado: 3 × 499 = 1,497
    await expect(page.getByText(/\$1[,.]497 MXN/)).toBeVisible();
    // 3 cobros
    await expect(page.getByText(/3 cobros/)).toBeVisible();
  });
});
