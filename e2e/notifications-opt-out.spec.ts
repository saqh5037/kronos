/**
 * E2E: Opt-out notifications (sprint 3.7)
 *
 * Cubre:
 *  - Owner toggle weekly digest off → DB flag false → cron skip + counts.optedOut
 *  - Owner toggle transactional off → cron lifecycle no crea audit EMAIL_SENT_PAYMENT_FAILED
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const CRON_SECRET = process.env.CRON_SECRET ?? "test-secret-123";

async function resetFlags(tenantId: string) {
  await db().box.update({
    where: { id: tenantId },
    data: {
      weeklyDigestEnabled: true,
      transactionalEmailsEnabled: true,
    },
  });
}

async function clearAudits(tenantId: string) {
  await db().auditEvent.deleteMany({
    where: {
      tenantId,
      targetType: "Box",
      OR: [
        {
          metadata: { path: ["kind"], equals: "EMAIL_SENT_OWNER_DIGEST" },
        },
        {
          metadata: { path: ["kind"], equals: "EMAIL_SENT_PAYMENT_FAILED" },
        },
      ],
    },
  });
}

test.describe.serial("Notifications opt-out", () => {
  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await resetFlags(tenantId);
    await disconnect();
  });

  test("owner toggle weekly digest off persiste en DB", async ({ page }) => {
    const tenantId = await getSeedBoxId();
    await resetFlags(tenantId);

    await loginAs(page, "owner");
    await page.goto("/admin/ajustes/notificaciones");

    await expect(
      page.getByRole("heading", { name: /notificaciones/i }),
    ).toBeVisible();

    // Toggle weekly digest off (primer switch)
    const digestSwitch = page.getByRole("switch", {
      name: "Resumen semanal",
    });
    await expect(digestSwitch).toHaveAttribute("aria-checked", "true");
    await digestSwitch.click();
    await expect(digestSwitch).toHaveAttribute("aria-checked", "false");

    // Save
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await page.waitForTimeout(500);

    const box = await db().box.findUnique({
      where: { id: tenantId },
      select: { weeklyDigestEnabled: true },
    });
    expect(box?.weeklyDigestEnabled).toBe(false);
  });

  test("cron weekly-digest respeta opt-out (counts.optedOut)", async ({
    request,
  }) => {
    const tenantId = await getSeedBoxId();
    await db().box.update({
      where: { id: tenantId },
      data: { weeklyDigestEnabled: false },
    });
    await clearAudits(tenantId);

    const res = await request.get("/api/cron/owner-weekly-digest", {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts.optedOut).toBeGreaterThanOrEqual(1);

    const audit = await db().auditEvent.findFirst({
      where: {
        tenantId,
        targetType: "Box",
        metadata: {
          path: ["kind"],
          equals: "EMAIL_SENT_OWNER_DIGEST",
        },
      },
    });
    expect(audit).toBeNull();
  });

  test("cron lifecycle respeta transactional opt-out (no audit EMAIL_SENT_PAYMENT_FAILED)", async ({
    request,
  }) => {
    const tenantId = await getSeedBoxId();
    await db().box.update({
      where: { id: tenantId },
      data: { transactionalEmailsEnabled: false },
    });
    await clearAudits(tenantId);

    // Crear sub ACTIVE expirada para forzar transición ACTIVE → PAST_DUE
    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    await db().saasSubscription.deleteMany({ where: { tenantId } });
    await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    await db().box.update({
      where: { id: tenantId },
      data: { subscriptionStatus: "ACTIVE" },
    });

    const res = await request.get("/api/cron/saas-billing-lifecycle", {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);

    // No debe haberse creado audit EMAIL_SENT_PAYMENT_FAILED (opted out)
    const audit = await db().auditEvent.findFirst({
      where: {
        tenantId,
        targetType: "Box",
        metadata: {
          path: ["kind"],
          equals: "EMAIL_SENT_PAYMENT_FAILED",
        },
      },
    });
    expect(audit).toBeNull();
  });
});
