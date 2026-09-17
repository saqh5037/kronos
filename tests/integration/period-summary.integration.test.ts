/**
 * `getPeriodSummary` against a real Postgres — the regression net for P0 #6 of
 * the 2026-09-15 audit ("KPIs, section counts and pages disagree").
 *
 * The fixture reproduces every mismatch the reviewers found and asserts the
 * numbers now agree:
 *
 *   - a PENDING and a FAILED payment inside the window, so the Pagos KPI
 *     (which used to count only PAID rows by `paidAt`) matches the Pagos table
 *     (which counts every row by `createdAt`) — the 27-vs-33 bug;
 *   - a PAID payment dated LATER in the same calendar month but outside the
 *     window, so a month-wide query and a period query differ — the
 *     $214,000-vs-$138,750 bug;
 *   - a PAUSED athlete, so "atletas activos" cannot drift into "seats booked";
 *   - an overdue membership on an otherwise-healthy athlete, so morosos are
 *     provably a subset of the at-risk list;
 *   - a class at 18:00 CDMX (= 00:00 UTC the next day), so the day buckets are
 *     proven to follow the box timezone.
 *
 * Skips when DATABASE_URL is unset (CI without compose), like the other
 * integration suites.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  type Mock,
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

const TZ = "America/Mexico_City"; // fixed UTC-6

// The window under test: 1–15 sep in box-local civil days.
const FROM = new Date("2026-09-01T06:00:00.000Z"); // Sep 1 00:00 CDMX
const TO = new Date("2026-09-16T05:59:59.999Z"); // Sep 15 23:59:59.999 CDMX

const at = (iso: string) => new Date(iso);

describe.skipIf(!process.env.DATABASE_URL)("period summary integration", () => {
  const client = getTestClient();
  const tenantId = `test-period-${Date.now()}`;
  let available = false;

  // Loaded dynamically so a missing DATABASE_URL never constructs Prisma.
  let summaryMod: typeof import("../../src/server/period-summary");
  let paymentsMod: typeof import("../../src/server/actions/payments");
  let athletesMod: typeof import("../../src/server/actions/athletes");
  let reportsMod: typeof import("../../src/server/actions/reports");
  let churnMod: typeof import("../../src/server/analytics/churn");

  let summary: import("../../src/server/period-summary").PeriodSummary;

  beforeAll(async () => {
    available = await isDbAvailable();
    if (!available) return;

    const { getServerSession } = await import("next-auth");
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: { id: "u-owner", tenantId, role: "OWNER", email: "o@test.mx" },
    });

    await client.box.create({
      data: {
        id: tenantId,
        slug: tenantId,
        name: "Period Test Box",
        timezone: TZ,
      },
    });

    const plan = await client.membershipPlan.create({
      data: {
        tenantId,
        name: "Mensual",
        type: "MONTHLY",
        price: 1000,
        currency: "MXN",
      },
    });

    const mk = (firstName: string, status: "ACTIVE" | "PAUSED", born: string) =>
      client.athlete.create({
        data: {
          tenantId,
          firstName,
          lastName: "Test",
          status,
          createdAt: at(born),
        },
      });

    // Carla is created but never referenced again: she only has to exist for
    // the "brand-new athlete is not at risk" assertion.
    const [ana, beto, , dora, eva] = await Promise.all([
      mk("Ana", "ACTIVE", "2026-01-10T12:00:00.000Z"), // trains, paid up
      mk("Beto", "ACTIVE", "2026-01-10T12:00:00.000Z"), // absent 45 days
      mk("Carla", "ACTIVE", "2026-09-14T18:00:00.000Z"), // brand new, no visit
      mk("Dora", "ACTIVE", "2026-01-10T12:00:00.000Z"), // trains, overdue
      mk("Eva", "PAUSED", "2026-01-10T12:00:00.000Z"), // not on the roster
    ]);

    const membership = (athleteId: string, endDate: string) =>
      client.membership.create({
        data: {
          tenantId,
          athleteId,
          planId: plan.id,
          startDate: at("2026-08-01T06:00:00.000Z"),
          endDate: at(endDate),
          status: "ACTIVE",
        },
      });

    const [mAna, , , mDora] = await Promise.all([
      membership(ana.id, "2026-10-01T06:00:00.000Z"),
      membership(beto.id, "2026-10-01T06:00:00.000Z"),
      membership(eva.id, "2026-10-01T06:00:00.000Z"),
      membership(dora.id, "2026-09-01T06:00:00.000Z"), // lapsed → moroso
    ]);

    await Promise.all([
      // in the window, PAID
      client.payment.create({
        data: {
          tenantId,
          membershipId: mAna.id,
          amount: 1000,
          currency: "MXN",
          gateway: "CASH",
          status: "PAID",
          paidAt: at("2026-09-03T18:00:00.000Z"),
          createdAt: at("2026-09-03T18:00:00.000Z"),
        },
      }),
      client.payment.create({
        data: {
          tenantId,
          membershipId: mAna.id,
          amount: 500,
          currency: "MXN",
          gateway: "CASH",
          status: "PAID",
          paidAt: at("2026-09-10T18:00:00.000Z"),
          createdAt: at("2026-09-10T18:00:00.000Z"),
        },
      }),
      // in the window, not revenue — the rows the old KPI silently dropped
      client.payment.create({
        data: {
          tenantId,
          membershipId: mDora.id,
          amount: 250,
          currency: "MXN",
          gateway: "MERCADOPAGO",
          status: "PENDING",
          createdAt: at("2026-09-12T18:00:00.000Z"),
        },
      }),
      client.payment.create({
        data: {
          tenantId,
          membershipId: mDora.id,
          amount: 300,
          currency: "MXN",
          gateway: "MERCADOPAGO",
          status: "FAILED",
          createdAt: at("2026-09-13T18:00:00.000Z"),
        },
      }),
      // same calendar month, AFTER the window — a month query would swallow it
      client.payment.create({
        data: {
          tenantId,
          membershipId: mAna.id,
          amount: 9999,
          currency: "MXN",
          gateway: "CASH",
          status: "PAID",
          paidAt: at("2026-09-25T18:00:00.000Z"),
          createdAt: at("2026-09-25T18:00:00.000Z"),
        },
      }),
      // the previous window, for the delta
      client.payment.create({
        data: {
          tenantId,
          membershipId: mAna.id,
          amount: 700,
          currency: "MXN",
          gateway: "CASH",
          status: "PAID",
          paidAt: at("2026-08-25T18:00:00.000Z"),
          createdAt: at("2026-08-25T18:00:00.000Z"),
        },
      }),
    ]);

    // 18:00 CDMX on Sep 14 == 00:00 UTC on Sep 15. The bucket must be Sep 14.
    const nightClass = await client.class.create({
      data: {
        tenantId,
        startsAt: at("2026-09-15T00:00:00.000Z"),
        durationMin: 60,
        capacity: 10,
      },
    });
    const morningClass = await client.class.create({
      data: {
        tenantId,
        startsAt: at("2026-09-05T13:00:00.000Z"),
        durationMin: 60,
        capacity: 10,
      },
    });
    // Beto's last visit: well before the window, so he ages into "en riesgo".
    const oldClass = await client.class.create({
      data: {
        tenantId,
        startsAt: at("2026-08-01T13:00:00.000Z"),
        durationMin: 60,
        capacity: 10,
      },
    });

    await Promise.all([
      client.booking.create({
        data: {
          tenantId,
          classId: nightClass.id,
          athleteId: ana.id,
          status: "ATTENDED",
          checkedInAt: at("2026-09-15T00:05:00.000Z"),
        },
      }),
      client.booking.create({
        data: {
          tenantId,
          classId: nightClass.id,
          athleteId: dora.id,
          status: "ATTENDED",
          checkedInAt: at("2026-09-15T00:05:00.000Z"),
        },
      }),
      client.booking.create({
        data: {
          tenantId,
          classId: nightClass.id,
          athleteId: beto.id,
          status: "NOSHOW",
        },
      }),
      client.booking.create({
        data: {
          tenantId,
          classId: morningClass.id,
          athleteId: ana.id,
          status: "BOOKED",
        },
      }),
      client.booking.create({
        data: {
          tenantId,
          classId: oldClass.id,
          athleteId: beto.id,
          status: "ATTENDED",
          checkedInAt: at("2026-08-01T13:05:00.000Z"),
        },
      }),
    ]);

    summaryMod = await import("../../src/server/period-summary");
    paymentsMod = await import("../../src/server/actions/payments");
    athletesMod = await import("../../src/server/actions/athletes");
    reportsMod = await import("../../src/server/actions/reports");
    churnMod = await import("../../src/server/analytics/churn");

    summary = await summaryMod.computePeriodSummary(tenantId, {
      from: FROM,
      to: TO,
      tz: TZ,
    });
  }, 60_000);

  afterAll(async () => {
    if (available) {
      await client.payment.deleteMany({ where: { tenantId } });
      await client.booking.deleteMany({ where: { tenantId } });
      await client.class.deleteMany({ where: { tenantId } });
      await client.membership.deleteMany({ where: { tenantId } });
      await client.membershipPlan.deleteMany({ where: { tenantId } });
      await client.athlete.deleteMany({ where: { tenantId } });
      await client.box.deleteMany({ where: { id: tenantId } });
    }
    await disconnectTestClient();
  });

  // ── the three assertions the audit asked for ─────────────────────────────

  it("payments KPI equals the payments table total for the same filter", async () => {
    if (!available) return;
    const table = await paymentsMod.listPaymentsPaged({
      dateFrom: FROM,
      dateTo: TO,
      page: 1,
      pageSize: 100,
    });
    // PAID + PAID + PENDING + FAILED created inside the window.
    expect(summary.payments.count).toBe(4);
    expect(summary.payments.count).toBe(table.total);
    expect(table.rows).toHaveLength(table.total);
  });

  it("Pagos revenue equals Reportes revenue for the same period", async () => {
    if (!available) return;
    const reports = await reportsMod.getReports({
      from: FROM,
      to: TO,
      tz: TZ,
    });
    const stats = await paymentsMod.getPaymentStats({
      from: FROM,
      to: TO,
      tz: TZ,
    });

    expect(summary.revenue.total).toBe(1500);
    expect(reports.monthRevenue).toBe(summary.revenue.total);
    expect(stats.revenue).toBe(summary.revenue.total);
    expect(stats.monthRevenue).toBe(reports.monthRevenue);
    // The Sep-25 payment is inside the calendar month and outside the window:
    // a month-wide query would have reported 11,499 here.
    expect(summary.revenue.total).not.toBe(11499);
  });

  it("active athletes equal the ACTIVE athlete list total", async () => {
    if (!available) return;
    const list = await athletesMod.listAthletesPaged({
      status: "ACTIVE",
      page: 1,
      pageSize: 100,
    });
    expect(summary.athletes.active).toBe(4);
    expect(summary.athletes.active).toBe(list.total);
    expect(list.rows.every((r) => r.status === "ACTIVE")).toBe(true);
  });

  // ── the rest of the P0 #6 mismatches ─────────────────────────────────────

  it("at-risk is one number across Atletas, Reportes and the dashboard", async () => {
    if (!available) return;
    const [fromAtletas, fromReportes, counts, reports] = await Promise.all([
      athletesMod.getAtRiskAthletes({ from: FROM, to: TO, tz: TZ, limit: 50 }),
      churnMod.getChurnRiskList({ from: FROM, to: TO, tz: TZ }),
      athletesMod.getAthleteCounts({ from: FROM, to: TO, tz: TZ }),
      reportsMod.getReports({ from: FROM, to: TO, tz: TZ }),
    ]);

    // Beto (45 days absent) and Dora (overdue membership). Carla joined
    // yesterday, so she is not flagged; Eva is PAUSED, so she is not counted.
    expect(summary.athletes.atRisk).toBe(2);
    expect(fromAtletas).toHaveLength(summary.athletes.atRisk);
    expect(fromReportes).toHaveLength(summary.athletes.atRisk);
    expect(counts.atRisk).toBe(summary.athletes.atRisk);
    expect(reports.athletesAtRisk).toBe(summary.athletes.atRisk);
  });

  it("morosos are a subset of the at-risk athletes", async () => {
    if (!available) return;
    const overdue = await paymentsMod.listOverdueMemberships({
      from: FROM,
      to: TO,
      tz: TZ,
      limit: 50,
    });

    expect(summary.memberships.overdueCount).toBe(1);
    expect(overdue).toHaveLength(summary.memberships.overdueCount);
    // 250 pending on that membership, not the 1,000 plan price.
    expect(summary.memberships.overdueTotal).toBe(250);

    const atRiskIds = new Set(
      summary.athletes.atRiskRows.map((r) => r.athleteId),
    );
    for (const row of summary.memberships.overdueRows) {
      expect(atRiskIds.has(row.athleteId)).toBe(true);
    }
  });

  it("splits the payment statuses instead of hiding them", async () => {
    if (!available) return;
    expect(summary.payments.paidCount).toBe(2);
    expect(summary.payments.paidTotal).toBe(1500);
    expect(summary.payments.pendingCount).toBe(1);
    expect(summary.payments.pendingTotal).toBe(250);
    expect(summary.payments.failedCount).toBe(1);
    expect(summary.payments.failedTotal).toBe(300);
    expect(summary.revenue.total).toBe(summary.payments.paidTotal);
  });

  it("computes the delta against the previous window", async () => {
    if (!available) return;
    expect(summary.revenue.previousTotal).toBe(700);
    expect(summary.revenue.deltaPct).toBeCloseTo((1500 - 700) / 700, 6);
  });

  // ── the day series ───────────────────────────────────────────────────────

  it("covers exactly the requested period, labelled", async () => {
    if (!available) return;
    expect(summary.period.label).toBe("1–15 sep");
    expect(summary.payments.byDay).toHaveLength(15);
    expect(summary.attendance.byDay).toHaveLength(15);
    expect(summary.payments.byDay[0].day).toBe("2026-09-01");
    expect(summary.payments.byDay[14].day).toBe("2026-09-15");
    expect(summary.payments.byDay.reduce((s, d) => s + d.revenue, 0)).toBe(
      summary.revenue.total,
    );
  });

  it("buckets an evening CDMX class on its local day, not the UTC one", async () => {
    if (!available) return;
    const sep14 = summary.attendance.byDay.find((d) => d.day === "2026-09-14");
    const sep15 = summary.attendance.byDay.find((d) => d.day === "2026-09-15");
    expect(sep14?.attended).toBe(2);
    expect(sep14?.noShow).toBe(1);
    expect(sep15?.attended).toBe(0);

    expect(summary.attendance.checkins).toBe(2);
    expect(summary.attendance.noShows).toBe(1);
    // 2 attended + 1 no-show + 1 still booked
    expect(summary.attendance.bookings).toBe(4);
    expect(summary.attendance.noShowRate).toBeCloseTo(1 / 3, 6);
  });

  it("serves the same series to getRevenueByDay and getAttendanceByDay", async () => {
    if (!available) return;
    const revenue = await paymentsMod.getRevenueByDay({
      dateFrom: FROM,
      dateTo: TO,
    });
    expect(revenue).toHaveLength(summary.payments.byDay.length);
    expect(revenue.reduce((s, p) => s + p.revenue, 0)).toBe(
      summary.revenue.total,
    );
  });

  it("never leaks another tenant's rows", async () => {
    if (!available) return;
    const empty = await summaryMod.computePeriodSummary(`${tenantId}-other`, {
      from: FROM,
      to: TO,
      tz: TZ,
    });
    expect(empty.payments.count).toBe(0);
    expect(empty.revenue.total).toBe(0);
    expect(empty.athletes.active).toBe(0);
    expect(empty.memberships.overdueCount).toBe(0);
    expect(empty.payments.byDay).toHaveLength(15);
  });
});
