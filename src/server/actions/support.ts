"use server";

/**
 * Support actions for Kronos super-admin impersonation system.
 *
 * Authorization model:
 *   1. All actions require requireSuperAdmin() (email-based gate).
 *   2. Write actions additionally require an active SupportSession cookie
 *      that is validated against the DB (closedAt null, expiresAt > now).
 *   3. The boxId for all writes comes from the SupportSession — NEVER from
 *      the client. This prevents an agent from targeting a different box.
 *   4. Write actions intentionally skip the tenant RBAC can() check because
 *      super-admin authority supersedes tenant roles. This is documented at
 *      each action site.
 */

import { cookies } from "next/headers";
import { db as prismaBase } from "@/server/db";
import { requireSuperAdmin } from "@/server/super-admin-guard";
import { logAudit } from "@/server/audit";
import {
  normalizeSupportCode,
  generateUniqueSupportCode,
} from "@/lib/support-code";
import {
  signSupportSessionToken,
  verifySupportSessionToken,
  buildSupportSessionCookie,
  clearSupportSessionCookie,
  signVerificationToken,
  verifyVerificationToken,
  SUPPORT_SESSION_COOKIE,
} from "@/lib/support-session-token";
import { rateLimitCheck, rateLimitHit } from "@/lib/rate-limit";
import { computeMembershipEndDate } from "@/lib/membership";
import { subDays, startOfDay } from "date-fns";
import type { AthleteStatus } from "@prisma/client";
import type { PlanType } from "@/lib/validations/membership";
import { membershipAssignSchema } from "@/lib/validations/membership";
import { cashPaymentSchema } from "@/lib/validations/payment";
import type { AthleteRow, AthleteSort, AthleteDetail } from "./athletes";
import { type ListOpts, type ListResult, normalizePagination } from "./types";

// ─── SUPPORT SESSION TTL ──────────────────────────────────────────────────────

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── TYPED ERROR CODES ────────────────────────────────────────────────────────

export type SupportError =
  | "UNAUTHORIZED"
  | "INVALID_CODE"
  | "RATE_LIMITED"
  | "NO_SESSION"
  | "SESSION_EXPIRED"
  | "MISSING_SECRET"
  | "RESOURCE_NOT_IN_BOX"
  | "NOT_FOUND"
  | "UNVERIFIED";

export type SupportResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: SupportError };

// ─── PRIVATE: SUPPORT SESSION CONTEXT ────────────────────────────────────────

export type SupportSessionCtx = {
  boxId: string;
  agentId: string;
  agentEmail: string;
  sessionId: string;
};

/**
 * Validates the caller is a super-admin with a valid, active support session.
 * Returns the session context or an error object.
 *
 * Flow:
 *   1. requireSuperAdmin()
 *   2. Read cookie → verify HMAC + exp (fast local check)
 *   3. Look up DB row: exists + closedAt is null + expiresAt > now
 *   4. If expired in DB, mark closedAt and return EXPIRED
 */
async function requireSupportSession(): Promise<
  SupportSessionCtx | { ok: false; error: SupportError }
> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, error: "UNAUTHORIZED" };

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SUPPORT_SESSION_COOKIE)?.value;
  if (!rawToken) return { ok: false, error: "NO_SESSION" };

  const tokenResult = verifySupportSessionToken(rawToken);
  if (!tokenResult.ok) {
    if (tokenResult.reason === "MISSING_SECRET") {
      return { ok: false, error: "MISSING_SECRET" };
    }
    return { ok: false, error: "NO_SESSION" };
  }

  const { payload } = tokenResult;

  const dbSession = await prismaBase.supportSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!dbSession) return { ok: false, error: "NO_SESSION" };
  if (dbSession.closedAt !== null) return { ok: false, error: "NO_SESSION" };

  if (dbSession.expiresAt.getTime() <= Date.now()) {
    // Mark as closed in DB — fire and forget, don't block caller
    prismaBase.supportSession
      .update({
        where: { id: dbSession.id },
        data: { closedAt: new Date() },
      })
      .catch(() => {});
    return { ok: false, error: "SESSION_EXPIRED" };
  }

  return {
    boxId: dbSession.boxId,
    agentId: dbSession.agentId,
    agentEmail: dbSession.agentEmail,
    sessionId: dbSession.id,
  };
}

// ─── PRIVATE: RESOURCE OWNERSHIP ASSERTIONS ──────────────────────────────────

async function assertAthleteInBox(
  boxId: string,
  athleteId: string,
): Promise<void> {
  const athlete = await prismaBase.athlete.findFirst({
    where: { id: athleteId, tenantId: boxId },
    select: { id: true },
  });
  if (!athlete) {
    throw new Error(
      `RESOURCE_NOT_IN_BOX: athlete ${athleteId} not found in box ${boxId}`,
    );
  }
}

async function assertMembershipInBox(
  boxId: string,
  membershipId: string,
): Promise<void> {
  const membership = await prismaBase.membership.findFirst({
    where: { id: membershipId, tenantId: boxId },
    select: { id: true },
  });
  if (!membership) {
    throw new Error(
      `RESOURCE_NOT_IN_BOX: membership ${membershipId} not found in box ${boxId}`,
    );
  }
}

async function assertPaymentInBox(
  boxId: string,
  paymentId: string,
): Promise<void> {
  const payment = await prismaBase.payment.findFirst({
    where: { id: paymentId, tenantId: boxId },
    select: { id: true },
  });
  if (!payment) {
    throw new Error(
      `RESOURCE_NOT_IN_BOX: payment ${paymentId} not found in box ${boxId}`,
    );
  }
}

async function assertBookingInBox(
  boxId: string,
  bookingId: string,
): Promise<void> {
  const booking = await prismaBase.booking.findFirst({
    where: { id: bookingId, tenantId: boxId },
    select: { id: true },
  });
  if (!booking) {
    throw new Error(
      `RESOURCE_NOT_IN_BOX: booking ${bookingId} not found in box ${boxId}`,
    );
  }
}

// ─── SUPPORT SESSION LIFECYCLE ────────────────────────────────────────────────

/**
 * Looks up a Box by its support code.
 *
 * Rate-limited per agentId: 10 attempts / 5 min. Failed lookups penalize
 * the counter (same error whether code doesn't exist or doesn't match)
 * to prevent enumeration timing attacks.
 *
 * Returns the same INVALID_CODE error whether the code is syntactically
 * invalid, doesn't exist, or doesn't match any box.
 */
export async function findBoxBySupportCode(rawCode: string): Promise<
  SupportResult<{
    box: {
      id: string;
      name: string;
      slug: string;
      subscriptionStatus: string;
      athleteCount: number;
      ownerEmail: string | null;
    };
    verificationToken: string;
  }>
> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, error: "UNAUTHORIZED" };

  // We need the agentEmail to key the rate limiter. Re-read session inline.
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/server/auth");
  const session = await getServerSession(authOptions);
  const agentId = session?.user?.id ?? "unknown";

  const rl = rateLimitCheck(
    `support-code-lookup:${agentId}`,
    10,
    5 * 60 * 1000,
  );
  if (!rl.ok) {
    return { ok: false, error: "RATE_LIMITED" };
  }

  const code = normalizeSupportCode(rawCode);
  if (!code) {
    rateLimitHit(`support-code-lookup:${agentId}`, 5 * 60 * 1000);
    return { ok: false, error: "INVALID_CODE" };
  }

  const box = await prismaBase.box.findFirst({
    where: { supportCode: code },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      users: {
        where: { role: "OWNER" },
        select: { email: true },
        take: 1,
      },
      _count: { select: { athletes: true } },
    },
  });

  if (!box) {
    rateLimitHit(`support-code-lookup:${agentId}`, 5 * 60 * 1000);
    return { ok: false, error: "INVALID_CODE" };
  }

  // Success: do NOT penalize the bucket — only failures consume slots.
  // Sign a short-lived verification token so openSupportSession can confirm
  // the caller actually went through the code-lookup step.
  const verificationToken = signVerificationToken(box.id);

  return {
    ok: true,
    box: {
      id: box.id,
      name: box.name,
      slug: box.slug,
      subscriptionStatus: box.subscriptionStatus,
      athleteCount: box._count.athletes,
      ownerEmail: box.users[0]?.email ?? null,
    },
    verificationToken,
  };
}

/**
 * Opens a support session for the given boxId.
 * Creates a SupportSession row, signs a cookie token, and sets the cookie.
 *
 * Requires a verificationToken produced by findBoxBySupportCode — this ensures
 * the caller went through the support code flow and cannot open a session on
 * an arbitrary boxId by guessing or manipulating the UI.
 *
 * Token is HMAC-signed, stateless, TTL 5 min, bound to the boxId.
 */
export async function openSupportSession(
  boxId: string,
  verificationToken: string,
  reason?: string,
): Promise<SupportResult<{ sessionId: string; expiresAt: Date }>> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, error: "UNAUTHORIZED" };

  // Verify the ephemeral token — must be signed, not expired, and match the boxId.
  const tokenResult = verifyVerificationToken(verificationToken, boxId);
  if (!tokenResult.ok) {
    return { ok: false, error: "UNVERIFIED" };
  }

  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/server/auth");
  const session = await getServerSession(authOptions);
  const agentId = session?.user?.id ?? "unknown";
  const agentEmail = session?.user?.email ?? "unknown";

  // Verify the box still exists (it may have been removed between steps)
  const box = await prismaBase.box.findUnique({
    where: { id: boxId },
    select: { id: true },
  });
  if (!box) return { ok: false, error: "NOT_FOUND" };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const dbSession = await prismaBase.supportSession.create({
    data: {
      boxId,
      agentId,
      agentEmail,
      reason: reason ?? null,
      openedAt: now,
      expiresAt,
    },
  });

  const tokenPayload = {
    sessionId: dbSession.id,
    boxId,
    agentId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const token = signSupportSessionToken(tokenPayload);
  const cookieValue = buildSupportSessionCookie(token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SUPPORT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin/super",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });

  void cookieValue; // used via cookies().set above; suppress unused warning

  await logAudit({
    tenantId: boxId,
    actorId: agentId,
    action: "SUPPORT_SESSION_OPENED",
    targetType: "SupportSession",
    targetId: dbSession.id,
    metadata: { agentEmail, reason: reason ?? null, expiresAt },
  });

  return { ok: true, sessionId: dbSession.id, expiresAt };
}

/**
 * Closes the active support session: marks closedAt, clears the cookie.
 */
export async function closeSupportSession(): Promise<
  SupportResult<Record<never, never>>
> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, error: "UNAUTHORIZED" };

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SUPPORT_SESSION_COOKIE)?.value;

  if (rawToken) {
    const tokenResult = verifySupportSessionToken(rawToken);
    if (tokenResult.ok) {
      const { payload } = tokenResult;
      // Best-effort: if the row doesn't exist or is already closed, ignore.
      const updated = await prismaBase.supportSession
        .updateMany({
          where: { id: payload.sessionId, closedAt: null },
          data: { closedAt: new Date() },
        })
        .catch(() => null);

      if (updated && updated.count > 0) {
        const dbSession = await prismaBase.supportSession.findUnique({
          where: { id: payload.sessionId },
          select: { boxId: true, agentId: true, agentEmail: true },
        });
        if (dbSession) {
          await logAudit({
            tenantId: dbSession.boxId,
            actorId: dbSession.agentId,
            action: "SUPPORT_SESSION_CLOSED",
            targetType: "SupportSession",
            targetId: payload.sessionId,
            metadata: { agentEmail: dbSession.agentEmail },
          });
        }
      }
    }
  }

  // Always clear the cookie regardless of whether we found a session
  const clearVal = clearSupportSessionCookie();
  void clearVal; // used below
  cookieStore.set(SUPPORT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin/super",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true };
}

/**
 * Returns the active support session info for the banner UI.
 * Returns null if there is no valid active session.
 */
export async function getActiveSupportSession(): Promise<{
  sessionId: string;
  boxId: string;
  boxName: string;
  agentEmail: string;
  expiresAt: Date;
} | null> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return null;

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SUPPORT_SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const tokenResult = verifySupportSessionToken(rawToken);
  if (!tokenResult.ok) return null;

  const { payload } = tokenResult;
  const dbSession = await prismaBase.supportSession.findUnique({
    where: { id: payload.sessionId },
  });
  if (!dbSession || dbSession.closedAt !== null) return null;
  if (dbSession.expiresAt.getTime() <= Date.now()) return null;

  const box = await prismaBase.box.findUnique({
    where: { id: dbSession.boxId },
    select: { name: true },
  });

  return {
    sessionId: dbSession.id,
    boxId: dbSession.boxId,
    boxName: box?.name ?? dbSession.boxId,
    agentEmail: dbSession.agentEmail,
    expiresAt: dbSession.expiresAt,
  };
}

// ─── READ ACTIONS ─────────────────────────────────────────────────────────────

/**
 * Lists athletes for the box in the active support session.
 * Clones the listAthletesPaged logic but uses prismaBase + explicit tenantId
 * instead of withTenant (which requires a regular session).
 */
export async function listSupportBoxAthletes(
  opts?: ListOpts<AthleteSort>,
): Promise<SupportResult<{ result: ListResult<AthleteRow> }>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  const { page, pageSize, skip, take } = normalizePagination(opts);
  const search = opts?.search?.trim();

  const where = {
    tenantId: ctx.boxId,
    ...(opts?.status ? { status: opts.status as AthleteStatus } : {}),
    ...(opts?.dateFrom || opts?.dateTo
      ? {
          createdAt: {
            ...(opts?.dateFrom ? { gte: opts.dateFrom } : {}),
            ...(opts?.dateTo ? { lte: opts.dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            {
              user: {
                email: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const sortBy = opts?.sortBy ?? "createdAt";
  const sortDir = opts?.sortDir ?? "desc";
  const orderBy =
    sortBy === "name"
      ? [
          { firstName: sortDir as "asc" | "desc" },
          { lastName: sortDir as "asc" | "desc" },
        ]
      : { [sortBy]: sortDir };

  const [total, athletes] = await Promise.all([
    prismaBase.athlete.count({ where }),
    prismaBase.athlete.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        user: { select: { email: true } },
        bookings: {
          where: { status: "ATTENDED" },
          orderBy: { checkedInAt: "desc" },
          take: 1,
          select: { checkedInAt: true },
        },
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { plan: { select: { name: true } } },
        },
        _count: { select: { scores: true } },
      },
    }),
  ]);

  const rows: AthleteRow[] = athletes.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    status: a.status,
    phone: a.phone,
    email: a.user?.email ?? null,
    createdAt: a.createdAt,
    lastAttendanceAt: a.bookings[0]?.checkedInAt ?? null,
    totalScores: a._count.scores,
    activePlanName: a.memberships[0]?.plan.name ?? null,
  }));

  return { ok: true, result: { rows, total, page, pageSize } };
}

/**
 * Returns full athlete detail for a support session box.
 * Clones getAthleteDetail logic using prismaBase.
 */
export async function getSupportAthleteDetail(
  athleteId: string,
): Promise<SupportResult<{ athlete: AthleteDetail }>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertAthleteInBox(ctx.boxId, athleteId);

  const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
  const now = new Date();

  const athlete = await prismaBase.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: { select: { email: true } },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
      bookings: {
        where: {
          status: "ATTENDED",
          checkedInAt: { gte: ninetyDaysAgo },
        },
        select: { checkedInAt: true },
      },
      prs: {
        orderBy: { achievedAt: "desc" },
        take: 8,
        include: { movement: { select: { name: true } } },
      },
    },
  });
  if (!athlete) return { ok: false, error: "NOT_FOUND" };

  const [paymentsRecent, nextBooking, bodyMetricRows] = await Promise.all([
    prismaBase.payment.findMany({
      where: { tenantId: ctx.boxId, membership: { athleteId: athlete.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prismaBase.booking.findFirst({
      where: {
        athleteId: athlete.id,
        status: { in: ["BOOKED", "WAITLIST"] },
        class: { startsAt: { gte: now } },
      },
      orderBy: { class: { startsAt: "asc" } },
      include: {
        class: {
          select: {
            id: true,
            startsAt: true,
            wod: { select: { name: true } },
          },
        },
      },
    }),
    prismaBase.bodyMetric.findMany({
      where: { athleteId: athlete.id },
      orderBy: { measuredAt: "desc" },
      take: 30,
    }),
  ]);

  const activeMembership = athlete.memberships[0]
    ? {
        id: athlete.memberships[0].id,
        planName: athlete.memberships[0].plan.name,
        planType: athlete.memberships[0].plan.type,
        startDate: athlete.memberships[0].startDate,
        endDate: athlete.memberships[0].endDate,
        classesUsed: 0,
      }
    : null;

  if (activeMembership && athlete.memberships[0]) {
    activeMembership.classesUsed = await prismaBase.booking.count({
      where: {
        athleteId: athlete.id,
        status: "ATTENDED",
        class: {
          startsAt: {
            gte: athlete.memberships[0].startDate,
            lte: athlete.memberships[0].endDate ?? new Date(),
          },
        },
      },
    });
  }

  const detail: AthleteDetail = {
    id: athlete.id,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    status: athlete.status,
    phone: athlete.phone,
    email: athlete.user?.email ?? null,
    createdAt: athlete.createdAt,
    activeMembership,
    attendanceLast90d: athlete.bookings
      .filter((b) => b.checkedInAt !== null)
      .map((b) => ({ date: b.checkedInAt as Date })),
    prsTop: athlete.prs.map((p) => ({
      id: p.id,
      movementName: p.movement.name,
      value: Number(p.value),
      unit: p.unit,
      achievedAt: p.achievedAt,
    })),
    paymentsRecent: paymentsRecent.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      gateway: p.gateway,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    nextClass: nextBooking
      ? {
          bookingId: nextBooking.id,
          classId: nextBooking.class.id,
          startsAt: nextBooking.class.startsAt,
          wodName: nextBooking.class.wod?.name ?? null,
        }
      : null,
    bodyMetricsRecent: bodyMetricRows.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      value: Number(r.value),
      unit: r.unit,
      measuredAt: r.measuredAt,
    })),
  };

  return { ok: true, athlete: detail };
}

// ─── WRITE ACTIONS (*AsSupport) ───────────────────────────────────────────────
//
// Pattern for every write:
//   1. requireSupportSession() → ctx
//   2. assert*InBox(ctx.boxId, resourceId) — DEFENSE: boxId from session only
//   3. mutation via prismaBase (skips RBAC can() — documented below)
//   4. logAudit with native action + metadata.viaSupport = true
//
// Skipping RBAC can(): super-admin authority deliberately supersedes tenant
// role permissions. The can() gate is a tenant-level check; support actions
// operate at the platform level. This is intentional and documented here.

/**
 * Updates an athlete's status as super-admin support.
 */
export async function updateAthleteStatusAsSupport(
  athleteId: string,
  status: AthleteStatus,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertAthleteInBox(ctx.boxId, athleteId);

  await prismaBase.athlete.update({
    where: { id: athleteId },
    data: { status },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "ATHLETE_STATUS_CHANGED",
    targetType: "Athlete",
    targetId: athleteId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
      status,
    },
  });

  return { ok: true };
}

/**
 * Assigns a membership to an athlete as super-admin support.
 * Skips RBAC can() — see module-level comment.
 */
export async function assignMembershipAsSupport(
  data: unknown,
): Promise<SupportResult<{ membershipId: string }>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  const parsed = membershipAssignSchema.parse(data);
  await assertAthleteInBox(ctx.boxId, parsed.athleteId);

  const plan = await prismaBase.membershipPlan.findFirst({
    where: { id: parsed.planId, tenantId: ctx.boxId },
  });
  if (!plan) return { ok: false, error: "NOT_FOUND" };
  if (!plan.isActive) return { ok: false, error: "NOT_FOUND" };

  const endDate = computeMembershipEndDate(parsed.startDate, {
    type: plan.type as PlanType,
    classesPerMonth: plan.classesPerMonth,
    durationDays: plan.durationDays,
  });

  const membership = await prismaBase.membership.create({
    data: {
      tenantId: ctx.boxId,
      athleteId: parsed.athleteId,
      planId: parsed.planId,
      startDate: parsed.startDate,
      endDate,
      status: parsed.pendingPayment ? "PENDING" : "ACTIVE",
      autoRenew: parsed.autoRenew,
    },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "MEMBERSHIP_ASSIGNED",
    targetType: "Membership",
    targetId: membership.id,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
      athleteId: parsed.athleteId,
      planId: parsed.planId,
      planType: plan.type,
    },
  });

  return { ok: true, membershipId: membership.id };
}

/**
 * Pauses a membership as super-admin support.
 */
export async function pauseMembershipAsSupport(
  membershipId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertMembershipInBox(ctx.boxId, membershipId);

  await prismaBase.membership.update({
    where: { id: membershipId },
    data: { status: "PAUSED" },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "MEMBERSHIP_PAUSED",
    targetType: "Membership",
    targetId: membershipId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

/**
 * Resumes a membership as super-admin support.
 */
export async function resumeMembershipAsSupport(
  membershipId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertMembershipInBox(ctx.boxId, membershipId);

  await prismaBase.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE" },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "MEMBERSHIP_ASSIGNED",
    targetType: "Membership",
    targetId: membershipId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
      operation: "resume",
    },
  });

  return { ok: true };
}

/**
 * Cancels a membership as super-admin support.
 * Skips RBAC REFUND_PAYMENT gate — see module-level comment.
 */
export async function cancelMembershipAsSupport(
  membershipId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertMembershipInBox(ctx.boxId, membershipId);

  await prismaBase.membership.update({
    where: { id: membershipId },
    data: { status: "CANCELLED", autoRenew: false },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "MEMBERSHIP_CANCELLED",
    targetType: "Membership",
    targetId: membershipId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

/**
 * Registers a cash payment as super-admin support.
 * Skips RBAC REGISTER_CASH_PAYMENT gate — see module-level comment.
 */
export async function registerCashPaymentAsSupport(
  data: unknown,
): Promise<SupportResult<{ paymentId: string }>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  const parsed = cashPaymentSchema.parse(data);
  await assertMembershipInBox(ctx.boxId, parsed.membershipId);

  const payment = await prismaBase.payment.create({
    data: {
      tenantId: ctx.boxId,
      membershipId: parsed.membershipId,
      amount: parsed.amount,
      currency: parsed.currency,
      gateway: "CASH",
      status: "PAID",
      paidAt: parsed.paidAt,
      notes: parsed.notes,
    },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "PAYMENT_REGISTERED",
    targetType: "Payment",
    targetId: payment.id,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
      membershipId: parsed.membershipId,
      amount: parsed.amount,
      currency: parsed.currency,
    },
  });

  return { ok: true, paymentId: payment.id };
}

/**
 * Voids a payment as super-admin support.
 * Skips RBAC REFUND_PAYMENT gate — see module-level comment.
 */
export async function voidPaymentAsSupport(
  paymentId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertPaymentInBox(ctx.boxId, paymentId);

  await prismaBase.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED" },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "PAYMENT_VOIDED",
    targetType: "Payment",
    targetId: paymentId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

/**
 * Cancels a booking as super-admin support.
 * Does NOT run the waitlist promotion logic (support cancellations are
 * administrative, not user-initiated). Waitlist promotion remains the
 * tenant's responsibility after-the-fact.
 */
export async function cancelBookingAsSupport(
  bookingId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertBookingInBox(ctx.boxId, bookingId);

  await prismaBase.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "BOOKING_CANCELLED",
    targetType: "Booking",
    targetId: bookingId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

/**
 * Checks in an athlete's booking as super-admin support.
 */
export async function checkInAthleteAsSupport(
  bookingId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertBookingInBox(ctx.boxId, bookingId);

  await prismaBase.booking.update({
    where: { id: bookingId },
    data: { status: "ATTENDED", checkedInAt: new Date() },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "BOOKING_CHECKIN",
    targetType: "Booking",
    targetId: bookingId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

/**
 * Marks a booking as no-show as super-admin support.
 */
export async function markNoShowAsSupport(
  bookingId: string,
): Promise<SupportResult<Record<never, never>>> {
  const ctx = await requireSupportSession();
  if (!("boxId" in ctx)) return ctx;

  await assertBookingInBox(ctx.boxId, bookingId);

  await prismaBase.booking.update({
    where: { id: bookingId },
    data: { status: "NOSHOW" },
  });

  await logAudit({
    tenantId: ctx.boxId,
    actorId: ctx.agentId,
    action: "BOOKING_NOSHOW",
    targetType: "Booking",
    targetId: bookingId,
    metadata: {
      viaSupport: true,
      supportSessionId: ctx.sessionId,
      agentEmail: ctx.agentEmail,
    },
  });

  return { ok: true };
}

// ─── UTILITY: ensure support code exists for a box ───────────────────────────

/**
 * Returns the supportCode for a box, generating one if needed.
 * Useful for the super-admin UI that displays box details.
 */
export async function ensureBoxSupportCode(
  boxId: string,
): Promise<SupportResult<{ supportCode: string }>> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, error: "UNAUTHORIZED" };

  const box = await prismaBase.box.findUnique({
    where: { id: boxId },
    select: { id: true, supportCode: true },
  });
  if (!box) return { ok: false, error: "NOT_FOUND" };

  if (box.supportCode) {
    return { ok: true, supportCode: box.supportCode };
  }

  const code = await generateUniqueSupportCode(prismaBase);
  await prismaBase.box.update({
    where: { id: boxId },
    data: { supportCode: code },
  });

  return { ok: true, supportCode: code };
}
