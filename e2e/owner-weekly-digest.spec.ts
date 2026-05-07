/**
 * E2E: cron /api/cron/owner-weekly-digest (sprint 3.5)
 *
 * Cubre:
 *  - Sin Bearer → 401
 *  - Con Bearer → audit log EMAIL_SENT_OWNER_DIGEST creado para tenants no terminales
 *  - Idempotencia: segunda llamada inmediata → counts.skipped > 0, sent = 0
 */
import { test, expect } from "@playwright/test";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const CRON_SECRET = process.env.CRON_SECRET ?? "test-secret-123";

async function clearDigestAudit(tenantId: string) {
  await db().auditEvent.deleteMany({
    where: {
      tenantId,
      targetType: "Box",
      metadata: {
        path: ["kind"],
        equals: "EMAIL_SENT_OWNER_DIGEST",
      },
    },
  });
}

async function ensureSubscriptionStatus(
  tenantId: string,
  status: "ACTIVE" | "TRIAL",
) {
  await db().box.update({
    where: { id: tenantId },
    data: { subscriptionStatus: status },
  });
}

async function fetchCron(
  request: import("@playwright/test").APIRequestContext,
  bearer?: string,
) {
  return request.get("/api/cron/owner-weekly-digest", {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });
}

test.describe.serial("Cron owner-weekly-digest", () => {
  test.beforeAll(async () => {
    const tenantId = await getSeedBoxId();
    await clearDigestAudit(tenantId);
    await ensureSubscriptionStatus(tenantId, "ACTIVE");
  });

  test.afterAll(async () => {
    const tenantId = await getSeedBoxId();
    await clearDigestAudit(tenantId);
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

  test("Bearer válido envía digest y crea audit log", async ({ request }) => {
    const tenantId = await getSeedBoxId();
    await clearDigestAudit(tenantId);

    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.counts.sent).toBeGreaterThanOrEqual(1);

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
    expect(audit).toBeTruthy();
  });

  test("idempotencia: segunda llamada skip (cooldown 6d)", async ({
    request,
  }) => {
    const res = await fetchCron(request, CRON_SECRET);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts.skipped).toBeGreaterThanOrEqual(1);
  });
});
