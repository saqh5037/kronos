/**
 * Dashboard agregator — verifica orquestación + filtros temporales.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth/providers/email", () => ({
  default: () => ({ id: "email", type: "email" }),
}));
vi.mock("next-auth/providers/google", () => ({
  default: () => ({ id: "google", type: "oauth" }),
}));
vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({}),
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const paymentFindMany = vi.fn();
const membershipFindMany = vi.fn();
const classCount = vi.fn();

vi.mock("../../src/server/db", () => ({
  db: {},
  withTenant: vi.fn(() => ({
    payment: { findMany: paymentFindMany },
    membership: { findMany: membershipFindMany },
    class: { count: classCount },
  })),
}));

vi.mock("../../src/server/actions/attendance", () => ({
  getTodayStats: vi.fn(),
}));

vi.mock("../../src/server/actions/bookings", () => ({
  listAvailableClasses: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getTodayStats } from "../../src/server/actions/attendance";
import { listAvailableClasses } from "../../src/server/actions/bookings";
import { getDashboardData } from "../../src/server/actions/dashboard";

const mockSession = getServerSession as unknown as ReturnType<typeof vi.fn>;
const mockTodayStats = getTodayStats as unknown as ReturnType<typeof vi.fn>;
const mockListClasses = listAvailableClasses as unknown as ReturnType<
  typeof vi.fn
>;

describe("getDashboardData", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockTodayStats.mockReset();
    mockListClasses.mockReset();
    paymentFindMany.mockReset();
    membershipFindMany.mockReset();
    classCount.mockReset();
  });

  it("rejects when no session", async () => {
    mockSession.mockResolvedValueOnce(null);
    await expect(getDashboardData()).rejects.toThrow("Unauthorized");
  });

  it("aggregates 5 sources in parallel", async () => {
    mockSession.mockResolvedValue({ user: { tenantId: "t1", role: "OWNER" } });
    mockTodayStats.mockResolvedValueOnce({
      totalClasses: 4,
      totalBooked: 50,
      totalAttended: 40,
      totalNoShow: 5,
      attendanceRate: 0.8,
    });
    mockListClasses.mockResolvedValueOnce([
      { id: "c1", startsAt: new Date(), capacity: 16, bookedCount: 10 },
      { id: "c2", startsAt: new Date(), capacity: 16, bookedCount: 12 },
    ]);
    paymentFindMany.mockResolvedValueOnce([{ amount: 500 }, { amount: 750.5 }]);
    membershipFindMany.mockResolvedValueOnce([
      {
        id: "m1",
        endDate: new Date("2026-05-08"),
        athlete: { firstName: "Ana", lastName: "García" },
        plan: { name: "Mensual" },
      },
    ]);
    classCount.mockResolvedValueOnce(2);

    const result = await getDashboardData();

    expect(result.todayStats.attendanceRate).toBe(0.8);
    expect(result.nextClasses).toHaveLength(2);
    expect(result.todayRevenue).toBe(1250.5);
    expect(result.todayPaymentsCount).toBe(2);
    expect(result.expiringMemberships).toHaveLength(1);
    expect(result.expiringMemberships[0].athleteName).toBe("Ana García");
    expect(result.expiringMemberships[0].planName).toBe("Mensual");
    expect(result.waitlistedClassesToday).toBe(2);
  });

  it("filters expiring memberships by 7-day window from start-of-day", async () => {
    mockSession.mockResolvedValue({ user: { tenantId: "t1", role: "OWNER" } });
    mockTodayStats.mockResolvedValueOnce({
      totalClasses: 0,
      totalBooked: 0,
      totalAttended: 0,
      totalNoShow: 0,
      attendanceRate: 0,
    });
    mockListClasses.mockResolvedValueOnce([]);
    paymentFindMany.mockResolvedValueOnce([]);
    membershipFindMany.mockResolvedValueOnce([]);
    classCount.mockResolvedValueOnce(0);

    await getDashboardData();

    const membershipsCall = membershipFindMany.mock.calls[0][0];
    expect(membershipsCall.where.status).toBe("ACTIVE");
    expect(membershipsCall.where.endDate.gte).toBeInstanceOf(Date);
    expect(membershipsCall.where.endDate.lte).toBeInstanceOf(Date);

    const range =
      membershipsCall.where.endDate.lte.getTime() -
      membershipsCall.where.endDate.gte.getTime();
    expect(range).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("limits next classes to 5", async () => {
    mockSession.mockResolvedValue({ user: { tenantId: "t1", role: "OWNER" } });
    mockTodayStats.mockResolvedValueOnce({
      totalClasses: 0,
      totalBooked: 0,
      totalAttended: 0,
      totalNoShow: 0,
      attendanceRate: 0,
    });
    const tooMany = Array.from({ length: 12 }, (_, i) => ({
      id: `c${i}`,
      startsAt: new Date(),
      capacity: 16,
      bookedCount: 0,
    }));
    mockListClasses.mockResolvedValueOnce(tooMany);
    paymentFindMany.mockResolvedValueOnce([]);
    membershipFindMany.mockResolvedValueOnce([]);
    classCount.mockResolvedValueOnce(0);

    const result = await getDashboardData();
    expect(result.nextClasses).toHaveLength(5);
  });

  it("sums today revenue ignoring non-numeric noise", async () => {
    mockSession.mockResolvedValue({ user: { tenantId: "t1", role: "OWNER" } });
    mockTodayStats.mockResolvedValueOnce({
      totalClasses: 0,
      totalBooked: 0,
      totalAttended: 0,
      totalNoShow: 0,
      attendanceRate: 0,
    });
    mockListClasses.mockResolvedValueOnce([]);
    paymentFindMany.mockResolvedValueOnce([
      { amount: "300.00" },
      { amount: "199.99" },
    ]);
    membershipFindMany.mockResolvedValueOnce([]);
    classCount.mockResolvedValueOnce(0);

    const result = await getDashboardData();
    expect(result.todayRevenue).toBeCloseTo(499.99, 2);
  });
});
