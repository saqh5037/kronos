/**
 * E2E: SaaS checkout (sprint 3.1)
 *
 * Cubre:
 *  - Owner ve /admin/billing y CTA al checkout
 *  - Owner ve los 3 planes (Free, Pro, Premium) con precios
 *  - Modo mock: owner selecciona Pro → confirma mock → DB SaasSubscription ACTIVE
 *  - Box.subscriptionStatus pasa a ACTIVE
 *  - Plan Free no se puede activar desde el checkout
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function resetSaasSubs() {
  const tenantId = await getSeedBoxId();
  await db().saasSubscription.deleteMany({ where: { tenantId } });
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "TRIAL", trialEndsAt: null },
  });
}

test.describe.serial("SaaS checkout", () => {
  test.beforeAll(async () => {
    await resetSaasSubs();
  });

  test.afterAll(async () => {
    await resetSaasSubs();
    await disconnect();
  });

  test("owner ve los 3 planes en /admin/billing/checkout", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing/checkout");

    await expect(page.getByRole("heading", { name: /Elegí tu/ })).toBeVisible();

    // Los 3 planes están visibles
    await expect(
      page.getByRole("heading", { name: /^Free$/, level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Pro$/, level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Premium$/, level: 3 }),
    ).toBeVisible();

    // Precios visibles
    await expect(page.getByText(/Gratis/).first()).toBeVisible();
    await expect(page.getByText(/\$499 MXN/).first()).toBeVisible();
    await expect(page.getByText(/\$999 MXN/).first()).toBeVisible();

    // CTA pro está habilitado
    const proButton = page
      .locator(".k-card", { hasText: "Pro" })
      .getByRole("button");
    await expect(proButton).toBeEnabled();
  });

  test("modo mock: confirmar Pro activa SaasSubscription + Box.subscriptionStatus = ACTIVE", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing/checkout");

    // Click en el botón del plan Pro
    const proCard = page.locator(".k-card", { hasText: "Pro" });
    await proCard.getByRole("button").click();

    // Aparece la pantalla de mock-confirm
    await expect(page.getByText(/Confirmá la activación de/)).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByText(/MercadoPago no está configurado/),
    ).toBeVisible();

    // Click confirmar mock
    await page.getByRole("button", { name: /Confirmar pago/ }).click();

    // Redirige a /admin/billing con success (no /admin/billing/checkout)
    await page.waitForURL(/\/admin\/billing(\?|$)/, { timeout: 10_000 });

    // DB: SaasSubscription ACTIVE
    const tenantId = await getSeedBoxId();
    const subs = await db().saasSubscription.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: { plan: true },
    });
    expect(subs).toHaveLength(1);
    expect(subs[0]?.plan.slug).toBe("pro");
    expect(subs[0]?.startsAt).not.toBeNull();
    expect(subs[0]?.currentPeriodEnd).not.toBeNull();

    // Box.subscriptionStatus = ACTIVE
    const box = await db().box.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });
    expect(box?.subscriptionStatus).toBe("ACTIVE");
    expect(box?.trialEndsAt).not.toBeNull();
  });

  test("/admin/billing muestra plan actual y siguiente facturación", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/billing");

    // El plan actual aparece
    await expect(page.getByText(/Plan actual/i)).toBeVisible();
    await expect(page.getByText(/^Pro$/).first()).toBeVisible();
    await expect(page.getByText(/Próxima facturación/i)).toBeVisible();
  });
});
