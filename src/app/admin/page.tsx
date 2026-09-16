import { redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { authOptions } from "@/server/auth";
import {
  getDashboardData,
  getDashboardSummary,
} from "@/server/actions/dashboard";
import { getBox } from "@/server/actions/box";
import { getAttendanceByDay } from "@/server/actions/attendance";
import { countUnreadNotifications } from "@/server/actions/notifications";
import { rangeFromParams, previousRange } from "@/lib/dates";
import { getCoachDashboardSnapshot } from "@/server/actions/coach-dashboard";
import { mapDashboardSummary } from "./_lib/dashboard-summary";
import AdminDashboardV3, {
  type AdminDashboardV3Props,
  type ClassRowData,
  type AlertRowData,
} from "@/components/kronos/v3/AdminDashboardV3";
import { CoachClassesTodayCard } from "./_components/CoachClassesTodayCard";
import { CoachAttendanceTodayCard } from "./_components/CoachAttendanceTodayCard";
import { AtRiskCard } from "./_components/AtRiskCard";
import AdminErrorState from "./_components/AdminErrorState";
import { dashboardGreeting } from "./_lib/greeting";
import { upcomingClasses } from "./_lib/schedule";
import {
  formatDateShort,
  formatDateWeekday,
  formatMoney,
  formatTime24,
} from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@prisma/client";
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

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

/**
 * `session.user.role` is typed `string` (see `src/types/next-auth.d.ts`), so
 * it is narrowed against the label map rather than cast: an unknown role then
 * falls back to the default line instead of rendering `undefined`.
 */
function asRole(value: string | undefined): Role | undefined {
  return value && value in roleLabel ? (value as Role) : undefined;
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

  // The window every number on this page belongs to. A preset is forwarded as
  // a preset so `summary.period.label` reads "últimos 30 días" like the picker
  // does, instead of a date pair that says the same thing less clearly.
  const periodInput = range.preset
    ? { preset: range.preset }
    : { from: range.from, to: range.to };

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let box: Awaited<ReturnType<typeof getBox>> | null = null;
  let summary: Awaited<ReturnType<typeof getDashboardSummary>> | null = null;
  let attendancePrev: Awaited<ReturnType<typeof getAttendanceByDay>> = [];
  let notificationCount = 0;
  let dashboardError: AdminDashboardErrorKind | null = null;
  let dashboardErrorDetail: string | null = null;

  try {
    // `getDashboardSummary` is the single source of every KPI and both chart
    // series below (audit 2026-09-15, P0 #6). The only extra range query is
    // the PREVIOUS window's attendance: the summary carries a previous total
    // for revenue but not for check-ins.
    [data, box, summary, attendancePrev, notificationCount] = await Promise.all(
      [
        getDashboardData(periodInput),
        getBox(),
        getDashboardSummary(periodInput),
        getAttendanceByDay({ dateFrom: prev.from, dateTo: prev.to }),
        countUnreadNotifications().catch(() => 0),
      ],
    );
  } catch (err) {
    if (isUnauthorizedError(err)) {
      dashboardError = "UNAUTHORIZED";
    } else if (isBoxNotFoundError(err)) {
      dashboardError = "BOX_NOT_FOUND";
    } else if (err instanceof Error && err.message === "Unauthorized") {
      // Fallback: otras server actions del Promise.all (getDashboardData,
      // getDashboardSummary, getAttendanceByDay) aún tiran Error genérico —
      // clasificamos por mensaje hasta tiparlas.
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

  if (dashboardError || !data || !box || !summary) {
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

  // One money style for the whole product: the dashboard used to print
  // "$2,500" from its own Intl instance next to "$2,500 MXN" on /admin/pagos
  // for the same peso (audit 2026-09-15, S4).
  const money = (amount: number) =>
    formatMoney(amount, { locale: box.locale, currency: box.currency });
  const now = new Date();
  const dateLabel = formatDateWeekday(now, box.timezone);

  // Every KPI, both series and both x-axes, from the one summary.
  const kpis = mapDashboardSummary(summary, {
    previousCheckins: attendancePrev.reduce((s, p) => s + p.attended, 0),
  });

  const session_ = session;

  // Owner info — the greeting names the PERSON and the time of day, never the
  // box and never a hardcoded "Buenos días" (audit 2026-09-15, /admin P2).
  const sessionName = session_.user?.name ?? null;
  const ownerName = sessionName ?? "Tu cuenta";
  const ownerInitial = ownerName.trim().charAt(0).toUpperCase() || "K";
  const greeting = dashboardGreeting(sessionName, now, box.timezone);

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
  if (kpis.atRiskCount > 0) {
    alerts.push({
      severity: "warning",
      text: `${kpis.atRiskCount} atleta${
        kpis.atRiskCount === 1 ? "" : "s"
      } en riesgo · ${kpis.atRiskNote?.toLowerCase() ?? "revisa la lista"}`,
      cta: "Ver atletas",
      href: "/admin/atletas?at_risk=1",
    });
  }

  // Next classes (table) — chronological, today only and without the classes
  // that already finished: the panel is titled "Próximas clases · hoy", so it
  // must read as a timeline of what is still ahead (audit top issue #8).
  const todayLabelForCompare = formatDateShort(now, box.timezone);
  const upcomingToday = upcomingClasses(data.nextClasses, now).filter(
    (c) => formatDateShort(c.startsAt, box.timezone) === todayLabelForCompare,
  );
  const nextClasses: ClassRowData[] = upcomingToday.map((c) => ({
    hora: formatTime24(c.startsAt, box.timezone),
    // The list sorts, hides finished classes and renders a 24-hour time from
    // this instant; `hora` is only the fallback for a row without one.
    startsAt: c.startsAt,
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
    // `role` goes through `roleLabel`; the old free-text line printed the raw
    // enum ("OWNER · IRON HANDS") straight into the sidebar.
    role: asRole(session_.user?.role),
    notificationCount,
    rangeLabel: kpis.rangeLabel,
    greeting,
    dateLabel,

    mrr: money(kpis.mrr),
    mrrDelta: kpis.mrrDeltaPct,
    mrrDeltaAbs: kpis.mrrDeltaAbs,
    mrrSpark: kpis.revenueChart.data,

    // The roster, not seats booked today: this tile said 27 while
    // /admin/atletas said 42 for the same box (audit P0 #6).
    activeAthletes: String(kpis.activeAthletes),
    arpu: kpis.arpu === null ? "—" : money(kpis.arpu),
    churn30d: "—",

    attendanceToday: {
      taken: data.todayStats.totalAttended,
      // Si no hay clases hoy, capacity = 0 (mostrar "0 / 0", no "0 / 1").
      // Si hay clases, el divisor es el max real entre booked y attended.
      capacity:
        data.todayStats.totalClasses > 0
          ? Math.max(
              data.todayStats.totalBooked,
              data.todayStats.totalAttended,
              1,
            )
          : 0,
      pct:
        data.todayStats.totalBooked > 0
          ? pct(data.todayStats.totalAttended, data.todayStats.totalBooked)
          : 0,
    },
    classesProgrammed: data.todayStats.totalClasses,
    classesWithWaitlist: data.waitlistedClassesToday,

    newAthletes30d: kpis.newAthletes,
    newAthletesDelta: undefined,
    newAthletesBreakdown: `alta en ${kpis.periodLabel}`,

    atRiskCount: kpis.atRiskCount,
    atRiskTotal: kpis.atRiskTotal,
    atRiskNote: kpis.atRiskNote,

    // `labels` come from `byDay[].day` of the requested period, so the x-axis
    // can no longer read "1 abr" under an "últimos 30 días" header.
    revenueChart: {
      data: kpis.revenueChart.data,
      labels: kpis.revenueChart.labels,
      total: money(kpis.revenueChart.total),
      delta: kpis.revenueChart.deltaPct,
    },
    attendanceChart: {
      data: kpis.attendanceChart.data,
      labels: kpis.attendanceChart.labels,
      total: String(kpis.attendanceChart.total),
      delta: kpis.attendanceChart.deltaPct,
    },

    nextClasses,
    alerts,
    classesTodayLabel:
      upcomingToday.length === 0
        ? `${data.todayStats.totalClasses} clase${
            data.todayStats.totalClasses === 1 ? "" : "s"
          } hoy · ya terminaron`
        : `${upcomingToday.length} por venir de ${data.todayStats.totalClasses} hoy`,
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
  const now = new Date();
  const greeting = dashboardGreeting(session.user?.name ?? null, now);
  const dateLabel = formatDateWeekday(now);

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
          {greeting}
        </h1>
        <p
          style={{
            color: "var(--k-t2)",
            fontSize: 14,
            margin: 0,
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
          <CoachClassesTodayCard
            classes={snapshot?.classesToday ?? []}
            now={now}
          />
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
