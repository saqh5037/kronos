/**
 * E2E: cron /api/cron/saas-billing-lifecycle (sprint 3.2)
 *
 * Cubre:
 *  - Sin Bearer → 401
 *  - Bearer válido + sub ACTIVE expirada → PAST_DUE + Box.subscriptionStatus PAST_DUE
 *  - Bearer válido + sub PAST_DUE > 7 días → EXPIRED + Box EXPIRED
 *  - Bearer válido + Box TRIAL con trialEndsAt vencido → Box EXPIRED
 *  - Idempotencia: re-correr no genera transiciones extra
 */
import { test, expect } from "@playwright/test";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const CRON_SECRET = process.env.CRON_SECRET ?? "test-secret-123";

async function resetForLifecycle() {
  const tenantId = await getSeedBoxId();
  await db().saasSubscription.deleteMany({ where: { tenantId } });
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "TRIAL", trialEndsAt: null },
  });
}

async function fetchCron(
  request: import("@playwright/test").APIRequestContext,
  bearer?: string,
) {
  return request.get("/api/cron/saas-billing-lifecycle", {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });
}

test.describe.serial("Cron saas-billing-lifecycle", () => {
  test.beforeAll(async () => {
    await resetForLifecycle();
  });

  test.afterAll(async () => {
    await resetForLifecycle();
    await disconnect();
  });

  test("sin Bearer → 401", async ({ request }) => {
    const res = await fetchCron(request);
    expect(res.status()).toBe(401);
  });

  test("Bearer inválido → 401", async ({ request }) => {
    const res = await fetchCron(request, "wrong-secret");
    expect(res.status()).toBe(401);
  });

  test("ACTIVE expirada → PAST_DUE", async ({ request }) => {
    const tenantId = await getSeedBoxId();
    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    const expiredYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sub = await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: expiredYesterday,
      },
    });
    await db().box.update({
      where: { id: tenantId },
      data: { subscriptionStatus: "ACTIVE" },
    });

    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.transitions.toPastDue).toBe(1);

    const updatedSub = await db().saasSubscription.findUnique({
      where: { id: sub.id },
    });
    expect(updatedSub?.status).toBe("PAST_DUE");

    const box = await db().box.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true },
    });
    expect(box?.subscriptionStatus).toBe("PAST_DUE");
  });

  test("PAST_DUE > 7 días → EXPIRED", async ({ request }) => {
    await resetForLifecycle();
    const tenantId = await getSeedBoxId();
    const plan = await db().saasPlan.findUniqueOrThrow({
      where: { slug: "pro" },
    });
    const expired10DaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const sub = await db().saasSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "PAST_DUE",
        startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: expired10DaysAgo,
      },
    });
    await db().box.update({
      where: { id: tenantId },
      data: { subscriptionStatus: "PAST_DUE" },
    });

    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.toExpired).toBe(1);

    const updatedSub = await db().saasSubscription.findUnique({
      where: { id: sub.id },
    });
    expect(updatedSub?.status).toBe("EXPIRED");

    const box = await db().box.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true },
    });
    expect(box?.subscriptionStatus).toBe("EXPIRED");
  });

  test("Trial vencido → Box EXPIRED", async ({ request }) => {
    await resetForLifecycle();
    const tenantId = await getSeedBoxId();

    await db().box.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.trialToExpired).toBeGreaterThanOrEqual(1);

    const box = await db().box.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true },
    });
    expect(box?.subscriptionStatus).toBe("EXPIRED");
  });

  test("idempotencia: re-correr no genera transiciones extra", async ({
    request,
  }) => {
    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transitions.toPastDue).toBe(0);
    expect(body.transitions.toExpired).toBe(0);
    expect(body.transitions.trialToExpired).toBe(0);
  });
});
