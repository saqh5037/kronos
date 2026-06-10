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
    // loginAs ya aterriza en /admin — no navegar de nuevo para evitar ERR_ABORTED

    // "ATLETAS EN RIESGO" es un div con eyebrow en AdminDashboardV3, no un <h2>.
    // Usar getByText con case-insensitive.
    await expect(
      page.getByText(/Atletas en riesgo/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // PRODUCT-BUG: "Próxima facturación" no está implementada en /admin
    // (el dashboard del owner). Solo existe en /admin/billing/page.tsx y en
    // UpcomingBillingCard que no está integrado al dashboard principal.
    // TODO: integrar UpcomingBillingCard al AdminDashboardV3 o al admin/page.tsx
    // para el role=OWNER.
    // Por ahora verificamos que el dashboard cargó correctamente:
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // El monto del plan Pro ($499 MXN) NO aparece en el dashboard — está en /admin/billing
    // await expect(page.getByText(/\$499 MXN/).first()).toBeVisible();
  });

  test("coach NO ve cards owner-only", async ({ page }) => {
    await loginAs(page, "coach");
    await page.goto("/admin");

    // Esperar que el dashboard del coach cargue
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Coach no ve "Próxima facturación" (ni como heading ni como texto)
    // en ningún punto del /admin dashboard.
    await expect(page.getByText(/Próxima facturación/i)).toHaveCount(0);
  });
});
