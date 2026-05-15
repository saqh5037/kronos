import { redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { authOptions } from "@/server/auth";
import { getDashboardData } from "@/server/actions/dashboard";
import { getBox } from "@/server/actions/box";
import { getRevenueByDay } from "@/server/actions/payments";
import { getAttendanceByDay } from "@/server/actions/attendance";
import { rangeFromParams, previousRange } from "@/lib/dates";
import { getOwnerDashboardSnapshot } from "@/server/actions/owner-dashboard";
import { getCoachDashboardSnapshot } from "@/server/actions/coach-dashboard";
import AdminDashboardV3, {
  type AdminDashboardV3Props,
  type ClassRowData,
  type AlertRowData,
} from "@/components/kronos/v3/AdminDashboardV3";
import { CoachClassesTodayCard } from "./_components/CoachClassesTodayCard";
import { CoachAttendanceTodayCard } from "./_components/CoachAttendanceTodayCard";
import { AtRiskCard } from "./_components/AtRiskCard";
import AdminErrorState from "./_components/AdminErrorState";
import OnboardingBanner from "@/components/admin/OnboardingBanner";
import { db as prismaBase } from "@/server/db";
import {
  isUnauthorizedError,
  isBoxNotFoundError,
  type AdminDashboardErrorKind,
} from "@/lib/errors";

export const metadata = { title: "Kronos — Dashboard" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
};

const RANGE_LABELS: Record<string, string> = {
  today: "HOY",
  yesterday: "AYER",
  last7: "ÚLTIMOS 7 DÍAS",
  last30: "ÚLTIMOS 30 DÍAS",
  last90: "ÚLTIMOS 90 DÍAS",
  thisMonth: "ESTE MES",
  lastMonth: "MES PASADO",
  thisYear: "ESTE AÑO",
  custom: "RANGO CUSTOM",
};

function fmtMoney(box: { locale: string; currency: string }) {
  return new Intl.NumberFormat(box.locale, {
    style: "currency",
    currency: box.currency,
    maximumFractionDigits: 0,
  });
}

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function deltaPctLabel(current: number, previous: number): string | undefined {
  if (previous === 0) {
    if (current === 0) return undefined;
    return "+100%";
  }
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // cookie corrupta — forzar re-login
  }
  if (!session?.user?.tenantId) {
    redirect("/login?callbackUrl=/admin");
  }

  // Role-aware branch: COACH/STAFF ven dashboard limitado (Sprint 3.12).
  // Sin revenue, sin billing, sin MRR — solo info operacional del coach.
  if (session.user.role === "COACH" || session.user.role === "STAFF") {
    return <CoachDashboard session={session} />;
  }

  const sp = (await searchParams) ?? {};
  const range = rangeFromParams({
    preset: sp.preset ?? "last30",
    from: sp.from,
    to: sp.to,
  });
  const prev = previousRange(range);

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let box: Awaited<ReturnType<typeof getBox>> | null = null;
  let revenuePoints: Awaited<ReturnType<typeof getRevenueByDay>> = [];
  let attendancePoints: Awaited<ReturnType<typeof getAttendanceByDay>> = [];
  let revenuePrev: Awaited<ReturnType<typeof getRevenueByDay>> = [];
  let attendancePrev: Awaited<ReturnType<typeof getAttendanceByDay>> = [];
  let snapshot: Awaited<ReturnType<typeof getOwnerDashboardSnapshot>> = null;
  let dashboardError: AdminDashboardErrorKind | null = null;
  let dashboardErrorDetail: string | null = null;

  try {
    [
      data,
      box,
      revenuePoints,
      revenuePrev,
      attendancePoints,
      attendancePrev,
      snapshot,
    ] = await Promise.all([
      getDashboardData(),
      getBox(),
      getRevenueByDay({ dateFrom: range.from, dateTo: range.to }),
      getRevenueByDay({ dateFrom: prev.from, dateTo: prev.to }),
      getAttendanceByDay({ dateFrom: range.from, dateTo: range.to }),
      getAttendanceByDay({ dateFrom: prev.from, dateTo: prev.to }),
      getOwnerDashboardSnapshot(),
    ]);
  } catch (err) {
    if (isUnauthorizedError(err)) {
      dashboardError = "UNAUTHORIZED";
    } else if (isBoxNotFoundError(err)) {
      dashboardError = "BOX_NOT_FOUND";
    } else if (err instanceof Error && err.message === "Unauthorized") {
      // Fallback: otras server actions del Promise.all (getDashboardData,
      // getRevenueByDay, getAttendanceByDay, getOwnerDashboardSnapshot) aún
      // tiran Error genérico — clasificamos por mensaje hasta tiparlas.
      dashboardError = "UNAUTHORIZED";
    } else if (err instanceof Error && err.message === "Box not found") {
      dashboardError = "BOX_NOT_FOUND";
    } else {
      dashboardError = "DB_ERROR";
    }
    dashboardErrorDetail =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ""}`
        : String(err);
    Sentry.captureException(err, {
      tags: {
        feature: "admin_dashboard",
        kind: dashboardError,
        userId: session.user.id ?? "unknown",
        tenantId: session.user.tenantId ?? "unknown",
      },
    });
  }

  if (dashboardError || !data || !box) {
    const kind: AdminDashboardErrorKind = dashboardError ?? "DB_ERROR";
    return (
      <AdminErrorState
        kind={kind}
        userEmail={session.user.email ?? null}
        userId={session.user.id ?? null}
        devDetail={
          process.env.NODE_ENV === "development" ? dashboardErrorDetail : null
        }
      />
    );
  }

  const money = fmtMoney(box);
  const dateLabel = new Intl.DateTimeFormat(box.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: box.timezone,
  }).format(new Date());
  const timeFmt = new Intl.DateTimeFormat(box.locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: box.timezone,
  });

  // Range KPIs
  const rangeRevenue = revenuePoints.reduce((s, p) => s + p.revenue, 0);
  const rangeRevenuePrev = revenuePrev.reduce((s, p) => s + p.revenue, 0);
  const rangeAttended = attendancePoints.reduce((s, p) => s + p.attended, 0);
  const rangeAttendedPrev = attendancePrev.reduce((s, p) => s + p.attended, 0);
  const revenueDelta = deltaPctLabel(rangeRevenue, rangeRevenuePrev);
  const attendanceDelta = deltaPctLabel(rangeAttended, rangeAttendedPrev);

  // MRR — uso revenue de los últimos 30 días como proxy si no hay snapshot
  const mrrCents =
    (snapshot?.monthlyRevenueCents ?? 0) > 0
      ? snapshot!.monthlyRevenueCents
      : Math.round(rangeRevenue * 100);
  const mrrPrev = Math.round(rangeRevenuePrev * 100);
  const mrrDeltaAbs =
    mrrCents > 0 && mrrPrev > 0
      ? `${money.format((mrrCents - mrrPrev) / 100)} vs período anterior`
      : undefined;

  const session_ = session;

  // Owner info
  const ownerName = session_.user?.name ?? "Owner";
  const ownerInitial = ownerName.trim().charAt(0).toUpperCase() || "O";
  const ownerFirstName = ownerName.split(" ")[0] || ownerName;
  const greeting = `Buenos días, ${ownerFirstName}`;

  // Alerts
  const alerts: AlertRowData[] = [];
  if (data.expiringMemberships.length > 0) {
    alerts.push({
      severity: "warning",
      text: `${data.expiringMemberships.length} membresía${
        data.expiringMemberships.length === 1 ? "" : "s"
      } por vencer en los próximos 7 días`,
      cta: "Revisar pagos",
      href: "/admin/pagos",
    });
  }
  if (data.waitlistedClassesToday > 0) {
    alerts.push({
      severity: "warning",
      text: `${data.waitlistedClassesToday} clase${
        data.waitlistedClassesToday === 1 ? "" : "s"
      } con waitlist hoy · revisa promociones`,
      cta: "Ver reservas",
      href: "/admin/reservas",
    });
  }
  if (snapshot && snapshot.athletesAtRisk.length > 0) {
    alerts.push({
      severity: "warning",
      text: `${snapshot.athletesAtRisk.length} atleta${
        snapshot.athletesAtRisk.length === 1 ? "" : "s"
      } sin asistir hace 14+ días`,
      cta: "Ver atletas",
      href: "/admin/atletas?at_risk=1",
    });
  }

  // Next classes (table)
  const nextClasses: ClassRowData[] = data.nextClasses.map((c) => ({
    hora: timeFmt.format(c.startsAt),
    clase: c.wod?.name ?? "Open Box",
    coach: c.coach?.name ?? "—",
    taken: c.bookedCount,
    capacity: c.capacity,
    waitlist: c.waitlistCount,
    action:
      c.bookedCount === c.capacity && c.waitlistCount > 0
        ? "Promover"
        : "Roster",
  }));

  // Box initials (2 chars)
  const boxInitials =
    box.name
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BX";

  const props: AdminDashboardV3Props = {
    boxName: box.name,
    boxLocation: undefined,
    boxInitials,
    ownerName,
    ownerInitial,
    ownerRole: `${session_.user?.role ?? "OWNER"} · ${box.name.toUpperCase()}`,
    rangeLabel: RANGE_LABELS[range.preset ?? "last30"] ?? "RANGO CUSTOM",
    greeting,
    dateLabel,

    mrr: money.format(mrrCents / 100),
    mrrDelta: revenueDelta,
    mrrDeltaAbs,
    mrrSpark: revenuePoints.map((p) => p.revenue),

    activeAthletes: String(
      data.todayStats.totalBooked > 0
        ? Math.max(data.todayStats.totalBooked, 1)
        : 0,
    ),
    arpu:
      mrrCents > 0 && data.todayStats.totalBooked > 0
        ? money.format(
            mrrCents / 100 / Math.max(1, data.todayStats.totalBooked),
          )
        : "—",
    churn30d: "—",

    attendanceToday: {
      taken: data.todayStats.totalAttended,
      capacity: Math.max(
        data.todayStats.totalBooked,
        data.todayStats.totalAttended,
        1,
      ),
      pct: pct(
        data.todayStats.totalAttended,
        Math.max(data.todayStats.totalBooked, 1),
      ),
    },
    classesProgrammed: data.todayStats.totalClasses,
    classesWithWaitlist: data.waitlistedClassesToday,

    newAthletes30d: 0,
    newAthletesDelta: undefined,
    newAthletesBreakdown: undefined,

    atRiskCount: snapshot?.athletesAtRisk.length ?? 0,
    atRiskTotal: snapshot?.athletesAtRisk.length
      ? Math.max(snapshot.athletesAtRisk.length, data.todayStats.totalBooked)
      : 0,
    atRiskNote:
      snapshot && snapshot.athletesAtRisk.length > 0
        ? "Sin asistir hace 14+ días"
        : undefined,

    revenueChart: {
      data: revenuePoints.map((p) => p.revenue),
      total: money.format(rangeRevenue),
      delta: revenueDelta,
    },
    attendanceChart: {
      data: attendancePoints.map((p) => p.attended),
      total: String(rangeAttended),
      delta: attendanceDelta,
    },

    nextClasses,
    alerts,
    classesTodayLabel: `${data.todayStats.totalClasses} clase${
      data.todayStats.totalClasses === 1 ? "" : "s"
    } programadas`,
  };

  // Onboarding banner state — only for OWNER, only if not completed
  let onboardingProgress: {
    show: boolean;
    hasMovements: boolean;
    hasSchedule: boolean;
    hasWods: boolean;
    hasPlan: boolean;
    hasStaff: boolean;
    hasPassword: boolean;
  } | null = null;
  if (session_.user?.role === "OWNER") {
    try {
      const [boxFlag, movementCount, wodCount, planCount, staffCount, owner] =
        await Promise.all([
          prismaBase.box.findUnique({
            where: { id: session_.user.tenantId },
            select: {
              onboardingCompletedAt: true,
              weeklySchedule: true,
            },
          }),
          prismaBase.movement.count({
            where: { tenantId: session_.user.tenantId },
          }),
          prismaBase.wOD.count({
            where: { tenantId: session_.user.tenantId },
          }),
          prismaBase.membershipPlan.count({
            where: { tenantId: session_.user.tenantId, isActive: true },
          }),
          prismaBase.user.count({
            where: {
              tenantId: session_.user.tenantId,
              role: { in: ["COACH", "STAFF"] },
            },
          }),
          prismaBase.user.findUnique({
            where: { id: session_.user.id },
            select: { passwordHash: true },
          }),
        ]);
      onboardingProgress = {
        show: !boxFlag?.onboardingCompletedAt,
        hasMovements: movementCount > 0,
        hasSchedule: Boolean(boxFlag?.weeklySchedule),
        hasWods: wodCount > 0,
        hasPlan: planCount > 0,
        hasStaff: staffCount > 0,
        hasPassword: Boolean(owner?.passwordHash),
      };
    } catch {
      // best-effort: si falla, no bloquea el dashboard
    }
  }

  return (
    <>
      {onboardingProgress?.show ? (
        <div style={{ padding: "16px 24px 0" }}>
          <OnboardingBanner {...onboardingProgress} />
        </div>
      ) : null}
      <AdminDashboardV3 {...props} />
    </>
  );
}

async function CoachDashboard({ session }: { session: Session }) {
  const snapshot = await getCoachDashboardSnapshot();
  const coachName = session.user?.name ?? "Coach";
  const firstName = coachName.split(" ")[0] || coachName;
  const dateLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        padding: "32px 24px",
        fontFamily: "var(--k-font-body)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Dashboard · Coach
        </p>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "8px 0 4px",
          }}
        >
          Hola, {firstName}
        </h1>
        <p
          style={{
            color: "var(--k-t2)",
            fontSize: 14,
            margin: 0,
            textTransform: "capitalize",
          }}
        >
          {dateLabel}
        </p>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}
        >
          <CoachClassesTodayCard classes={snapshot?.classesToday ?? []} />
          <CoachAttendanceTodayCard
            totals={
              snapshot?.attendanceTodayTotal ?? { booked: 0, attended: 0 }
            }
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <AtRiskCard rows={snapshot?.athletesAtRisk ?? []} />
        </div>
      </div>
    </div>
  );
}
