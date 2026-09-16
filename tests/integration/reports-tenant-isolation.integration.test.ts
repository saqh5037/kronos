/**
 * P0-1 of the 2026-09-15 fix wave, against a real Postgres.
 *
 * `withTenant()` only intercepted seven Prisma delegate methods; `groupBy` was
 * not one of them. `/admin/reportes` builds "Top WODs" and "Top atletas por
 * asistencia" from `db.score.groupBy` / `db.booking.groupBy`, so an owner's
 * report ranked every box in the database — another box's WOD names and
 * athlete names, rendered as that owner's own data.
 *
 * The fixture is deliberately lopsided: tenant A has NO scores and NO
 * attendance in the window, tenant B has plenty. Before the fix, A's report
 * showed B's rows. The positive control (the same loader run as B) keeps the
 * empty assertions from passing for the wrong reason.
 *
 * Skips when DATABASE_URL is unset, like the other integration suites.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  type Mock,
  vi,
} from "vitest";
import { isDbAvailable, getTestClient, disconnectTestClient } from "./setup";

// ── module stubs so the server actions can be imported outside Next ─────────
vi.mock("next-auth/providers/email", () => ({
  default: () => ({ id: "email", type: "email" }),
}));
vi.mock("next-auth/providers/google", () => ({
  default: () => ({ id: "google", type: "oauth" }),
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: () => ({ id: "credentials", type: "credentials" }),
}));
vi.mock("@next-auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(fn: T) => fn,
}));

const TZ = "America/Mexico_City";
const FROM = new Date("2026-09-01T06:00:00.000Z"); // Sep 1 00:00 CDMX
const TO = new Date("2026-09-16T05:59:59.999Z"); // Sep 15 23:59:59.999 CDMX

const at = (iso: string) => new Date(iso);

describe.skipIf(!process.env.DATABASE_URL)("reports · tenant isolation", () => {
  const client = getTestClient();
  const stamp = Date.now();
  const tenantA = `test-iso-a-${stamp}`;
  const tenantB = `test-iso-b-${stamp}`;
  let available = false;

  let reportsMod: typeof import("../../src/server/actions/reports");

  const asTenant = async (tenantId: string) => {
    const { getServerSession } = await import("next-auth");
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: {
        id: `u-${tenantId}`,
        tenantId,
        role: "OWNER",
        email: `owner@${tenantId}.mx`,
      },
    });
  };

  beforeAll(async () => {
    available = await isDbAvailable();
    if (!available) return;

    await client.box.createMany({
      data: [
        { id: tenantA, slug: tenantA, name: "Box A", timezone: TZ },
        { id: tenantB, slug: tenantB, name: "Box B", timezone: TZ },
      ],
    });

    // Tenant A exists and has a roster, but nobody trained in the window.
    await client.athlete.create({
      data: {
        tenantId: tenantA,
        firstName: "Ana",
        lastName: "Alfa",
        status: "ACTIVE",
      },
    });

    // Tenant B: one WOD with scores and one athlete with check-ins, all inside
    // the window — exactly the rows that used to bleed into A's report.
    const betoBox = await client.athlete.create({
      data: {
        tenantId: tenantB,
        firstName: "Beto",
        lastName: "Beta",
        status: "ACTIVE",
      },
    });
    const wodB = await client.wOD.create({
      data: {
        tenantId: tenantB,
        name: "Fran del Box B",
        type: "FORTIME",
        scoreType: "TIME",
      },
    });
    await client.score.createMany({
      data: [
        {
          tenantId: tenantB,
          wodId: wodB.id,
          athleteId: betoBox.id,
          value: 180,
          unit: "s",
          createdAt: at("2026-09-05T18:00:00.000Z"),
        },
        {
          tenantId: tenantB,
          wodId: wodB.id,
          athleteId: betoBox.id,
          value: 175,
          unit: "s",
          createdAt: at("2026-09-08T18:00:00.000Z"),
        },
      ],
    });

    const classB = await client.class.create({
      data: {
        tenantId: tenantB,
        startsAt: at("2026-09-10T13:00:00.000Z"),
        durationMin: 60,
        capacity: 10,
      },
    });
    await client.booking.create({
      data: {
        tenantId: tenantB,
        classId: classB.id,
        athleteId: betoBox.id,
        status: "ATTENDED",
        checkedInAt: at("2026-09-10T13:05:00.000Z"),
      },
    });

    reportsMod = await import("../../src/server/actions/reports");
  }, 60_000);

  afterAll(async () => {
    if (available) {
      for (const tenantId of [tenantA, tenantB]) {
        await client.score.deleteMany({ where: { tenantId } });
        await client.booking.deleteMany({ where: { tenantId } });
        await client.class.deleteMany({ where: { tenantId } });
        await client.wOD.deleteMany({ where: { tenantId } });
        await client.athlete.deleteMany({ where: { tenantId } });
        await client.box.deleteMany({ where: { id: tenantId } });
      }
    }
    await disconnectTestClient();
  });

  it("never lets another tenant's rows into Top WODs or Top atletas", async () => {
    if (!available) return;
    await asTenant(tenantA);
    const reports = await reportsMod.getReports({ from: FROM, to: TO, tz: TZ });

    expect(reports.topWODs).toEqual([]);
    expect(reports.topAttendees).toEqual([]);
    expect(reports.monthScores).toBe(0);
    expect(reports.monthAttended).toBe(0);
  });

  it("reads the Box itself through the scoped client", async () => {
    if (!available) return;
    const { withTenant } = await import("../../src/server/db");

    // `Box` has no `tenantId` column — the Box IS the tenant. The extension
    // used to inject `where.tenantId` into every model, so this exact shape
    // (live in the Mercado Pago checkout action and the adherence heatmap)
    // threw `Unknown argument tenantId` instead of returning the box.
    const box = await withTenant(tenantA).box.findUnique({
      where: { id: tenantA },
      select: { name: true, timezone: true },
    });
    expect(box).toEqual({ name: "Box A", timezone: TZ });
  });

  it("still scopes a tenant model on the same client", async () => {
    if (!available) return;
    const { withTenant } = await import("../../src/server/db");

    // Tenant A's client must not see B's athlete, through any method.
    const [count, grouped, aggregate] = await Promise.all([
      withTenant(tenantA).athlete.count(),
      withTenant(tenantA).score.groupBy({
        by: ["wodId"],
        _count: { _all: true },
      }),
      withTenant(tenantA).booking.aggregate({ _count: { _all: true } }),
    ]);
    expect(count).toBe(1); // Ana Alfa only
    expect(grouped).toEqual([]);
    expect(aggregate._count._all).toBe(0);
  });

  it("still reports a tenant's own rows (the assertions are not vacuous)", async () => {
    if (!available) return;
    await asTenant(tenantB);
    const reports = await reportsMod.getReports({ from: FROM, to: TO, tz: TZ });

    expect(reports.topWODs).toHaveLength(1);
    expect(reports.topWODs[0]).toMatchObject({
      name: "Fran del Box B",
      scoreCount: 2,
    });
    expect(reports.topAttendees).toEqual([
      { athleteName: "Beto Beta", attendedCount: 1 },
    ]);
    expect(reports.monthScores).toBe(2);
  });
});
