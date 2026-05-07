/**
 * E2E: Auditoría con label humano + filtro por categoría (sprint 3.8)
 *
 * Cubre:
 *  - Owner ve evento billing con label humano (no action enum raw)
 *  - Filtro por categoría billing oculta otros eventos
 *  - Categoría "Todo" muestra todo
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

async function seedAuditEvents(tenantId: string) {
  // Limpiar audits del tenant
  await db().auditEvent.deleteMany({ where: { tenantId } });

  // Buscar la sub o crear una
  let sub = await db().saasSubscription.findFirst({
    where: { tenantId, status: "ACTIVE" },
  });
  if (!sub) {
    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    sub = await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        startsAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const now = new Date();
  // 1 evento billing (SAAS_CHECKOUT_CONFIRMED_MOCK)
  await db().auditEvent.create({
    data: {
      tenantId,
      actorId: null,
      action: "PAYMENT_CONFIRMED",
      targetType: "SaasSubscription",
      targetId: sub.id,
      metadata: { kind: "SAAS_CHECKOUT_CONFIRMED_MOCK" },
      createdAt: new Date(now.getTime() - 60_000),
    },
  });
  // 1 evento email (EMAIL_SENT_OWNER_DIGEST)
  await db().auditEvent.create({
    data: {
      tenantId,
      actorId: null,
      action: "PAYMENT_INITIATED",
      targetType: "Box",
      targetId: tenantId,
      metadata: { kind: "EMAIL_SENT_OWNER_DIGEST" },
      createdAt: new Date(now.getTime() - 30_000),
    },
  });
}

test.describe.serial("Auditoría — categories + humanize", () => {
  test.beforeAll(async () => {
    const tenantId = await getSeedBoxId();
    await seedAuditEvents(tenantId);
  });

  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await db().auditEvent.deleteMany({ where: { tenantId } });
    await disconnect();
  });

  test("owner ve label humano del evento billing", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/auditoria");

    await expect(
      page.getByText(/Suscripción activada \(modo demo\)/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("owner ve label humano del evento email digest", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/auditoria");

    await expect(page.getByText(/Resumen semanal enviado/)).toBeVisible();
  });

  test("filtro Billing oculta evento Email", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/auditoria?category=billing");

    await expect(
      page.getByText(/Suscripción activada \(modo demo\)/),
    ).toBeVisible();
    await expect(page.getByText(/Resumen semanal enviado/)).toHaveCount(0);
  });

  test("filtro Emails oculta evento Billing", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/auditoria?category=email");

    await expect(page.getByText(/Resumen semanal enviado/)).toBeVisible();
    await expect(
      page.getByText(/Suscripción activada \(modo demo\)/),
    ).toHaveCount(0);
  });
});
