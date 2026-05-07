/**
 * E2E: Renovación automática mock (sprint 3.10)
 *
 * Cubre:
 *  - Sub ACTIVE expirada (currentPeriodEnd ayer) → cron ejecuta → sigue ACTIVE,
 *    period extendido +1 mes, nueva SaasInvoice creada, audit SAAS_RENEWED_MOCK
 *  - Re-correr cron no genera segunda renovación (period ahora futuro)
 *  - Sub CANCELLED expirada NO se renueva
 */
import { test, expect } from "@playwright/test";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const CRON_SECRET = process.env.CRON_SECRET ?? "test-secret-123";

async function fetchCron(
  request: import("@playwright/test").APIRequestContext,
  bearer = CRON_SECRET,
) {
  return request.get("/api/cron/saas-billing-lifecycle", {
    headers: { authorization: `Bearer ${bearer}` },
  });
}

async function clearAudits(tenantId: string) {
  await db().auditEvent.deleteMany({
    where: {
      tenantId,
      OR: [{ metadata: { path: ["kind"], equals: "SAAS_RENEWED_MOCK" } }],
    },
  });
}

test.describe.serial("Cron renewal mock", () => {
  test.beforeAll(async () => {
    const tenantId = await getSeedBoxId();
    await db().saasInvoice.deleteMany({ where: { tenantId } });
    await db().saasSubscription.deleteMany({ where: { tenantId } });
    await db().box.update({
      where: { id: tenantId },
      data: { subscriptionStatus: "ACTIVE" },
    });
  });

  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await db().saasInvoice.deleteMany({ where: { tenantId } });
    await db().saasSubscription.deleteMany({ where: { tenantId } });
    await clearAudits(tenantId);
    await disconnect();
  });

  test("sub ACTIVE expirada → renovada en mock + nueva invoice + audit", async ({
    request,
  }) => {
    const tenantId = await getSeedBoxId();
    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    const oldPeriodEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sub = await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: oldPeriodEnd,
      },
    });
    // Invoice histórica del periodo anterior
    await db().saasInvoice.create({
      data: {
        tenantId,
        subscriptionId: sub.id,
        amountMxnCents: plan.priceMxnCents,
        status: "PAID",
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: oldPeriodEnd,
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
    await clearAudits(tenantId);

    const res = await fetchCron(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.renewedMock).toBe(1);
    expect(body.transitions.toPastDue).toBe(0);

    const updatedSub = await db().saasSubscription.findUnique({
      where: { id: sub.id },
    });
    expect(updatedSub?.status).toBe("ACTIVE");
    // currentPeriodEnd debe ser oldPeriodEnd + 1 mes
    expect(updatedSub?.currentPeriodEnd).not.toBeNull();
    if (updatedSub?.currentPeriodEnd) {
      const expected = new Date(oldPeriodEnd);
      expected.setMonth(expected.getMonth() + 1);
      expect(updatedSub.currentPeriodEnd.getTime()).toBe(expected.getTime());
    }

    const invoices = await db().saasInvoice.findMany({
      where: { tenantId, subscriptionId: sub.id },
    });
    expect(invoices).toHaveLength(2);

    const audit = await db().auditEvent.findFirst({
      where: {
        tenantId,
        targetType: "SaasSubscription",
        metadata: { path: ["kind"], equals: "SAAS_RENEWED_MOCK" },
      },
    });
    expect(audit).toBeTruthy();
  });

  test("re-correr cron no genera segunda renovación (period ahora futuro)", async ({
    request,
  }) => {
    const tenantId = await getSeedBoxId();
    const invoicesBefore = await db().saasInvoice.count({
      where: { tenantId },
    });

    const res = await fetchCron(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.renewedMock).toBe(0);

    const invoicesAfter = await db().saasInvoice.count({
      where: { tenantId },
    });
    expect(invoicesAfter).toBe(invoicesBefore);
  });

  test("sub CANCELLED expirada NO se renueva", async ({ request }) => {
    const tenantId = await getSeedBoxId();
    await db().saasInvoice.deleteMany({ where: { tenantId } });
    await db().saasSubscription.deleteMany({ where: { tenantId } });

    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "CANCELLED",
        startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
        cancelledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await fetchCron(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.renewedMock).toBe(0);

    const invoices = await db().saasInvoice.count({ where: { tenantId } });
    expect(invoices).toBe(0);
  });
});
