"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import type { AuditAction } from "@prisma/client";

async function requireOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden — OWNER only");
  return session;
}

export type FeedSeverity = "info" | "warning" | "sensitive";

export type FeedTarget = {
  type: string;
  label: string;
  link?: string;
};

export type FeedActor = {
  id: string;
  name: string;
  role: string;
};

export type FeedEvent = {
  id: string;
  when: Date;
  actor: FeedActor | null;
  action: AuditAction;
  target: FeedTarget;
  metadata: Record<string, unknown>;
  severity: FeedSeverity;
};

// Actions that are considered sensitive for the owner feed
const SENSITIVE_ACTIONS: AuditAction[] = [
  "PAYMENT_VOIDED",
  "PAYMENT_REGISTERED",
  "MEMBERSHIP_CANCELLED",
];

const WARNING_ACTIONS: AuditAction[] = [
  "MEMBERSHIP_PAUSED",
  "PLAN_ARCHIVED",
  "WOD_ARCHIVED",
];

function classifySeverity(
  action: AuditAction,
  metadata: Record<string, unknown>,
): FeedSeverity {
  if (SENSITIVE_ACTIONS.includes(action)) {
    // PAYMENT_REGISTERED is only sensitive when it's a cash payment
    if (action === "PAYMENT_REGISTERED" && metadata?.gateway !== "CASH") {
      return "info";
    }
    return "sensitive";
  }
  if (WARNING_ACTIONS.includes(action)) return "warning";
  return "info";
}

/**
 * Resolves a readable label for an AuditEvent target.
 * Tries to fetch the entity name; falls back to "targetType #targetId".
 */
async function resolveTargetLabel(
  targetType: string,
  targetId: string,
  tenantId: string,
): Promise<FeedTarget> {
  const baseLink = `/admin`;

  try {
    if (targetType === "Athlete") {
      const athlete = await rawDb.athlete.findFirst({
        where: { id: targetId, tenantId },
        select: { firstName: true, lastName: true },
      });
      if (athlete) {
        return {
          type: targetType,
          label: `${athlete.firstName} ${athlete.lastName}`,
          link: `${baseLink}/atletas/${targetId}`,
        };
      }
    }

    if (targetType === "Payment") {
      const payment = await rawDb.payment.findFirst({
        where: { id: targetId, tenantId },
        select: {
          amount: true,
          currency: true,
          gateway: true,
          membership: {
            select: {
              athlete: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      if (payment) {
        const athleteName = payment.membership?.athlete
          ? `${payment.membership.athlete.firstName} ${payment.membership.athlete.lastName}`
          : "—";
        return {
          type: targetType,
          label: `Pago $${Number(payment.amount).toFixed(0)} ${payment.currency} · ${athleteName}`,
          link: `${baseLink}/pagos`,
        };
      }
    }

    if (targetType === "Membership") {
      const membership = await rawDb.membership.findFirst({
        where: { id: targetId, tenantId },
        select: {
          athlete: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
      });
      if (membership) {
        return {
          type: targetType,
          label: `${membership.athlete.firstName} ${membership.athlete.lastName} — ${membership.plan.name}`,
          link: `${baseLink}/pagos`,
        };
      }
    }

    if (targetType === "Class") {
      const klass = await rawDb.class.findFirst({
        where: { id: targetId, tenantId },
        select: { startsAt: true, wod: { select: { name: true } } },
      });
      if (klass) {
        const date = klass.startsAt.toLocaleDateString("es-MX", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          type: targetType,
          label: `Clase ${klass.wod?.name ?? ""} · ${date}`,
          link: `${baseLink}/programacion`,
        };
      }
    }

    if (targetType === "Score") {
      return {
        type: targetType,
        label: `Score #${targetId.slice(-6)}`,
        link: `${baseLink}/prs`,
      };
    }
  } catch {
    // Best-effort — fall through to default
  }

  return {
    type: targetType,
    label: `${targetType} #${targetId.slice(-8)}`,
  };
}

export type OwnerFeedOpts = {
  since?: Date;
  limit?: number;
  actorId?: string;
  action?: AuditAction;
};

export async function getOwnerLiveFeed(
  opts?: OwnerFeedOpts,
): Promise<FeedEvent[]> {
  const session = await requireOwnerSession();
  const tenantId = session.user.tenantId;

  const limit = opts?.limit ?? 50;
  const since = opts?.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h default

  const events = await rawDb.auditEvent.findMany({
    where: {
      tenantId,
      createdAt: { gte: since },
      ...(opts?.actorId ? { actorId: opts.actorId } : {}),
      ...(opts?.action ? { action: opts.action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (events.length === 0) return [];

  // Batch fetch actors (Users) to avoid N+1
  const actorIds = Array.from(
    new Set(events.map((e) => e.actorId).filter((id): id is string => !!id)),
  );
  const actors =
    actorIds.length > 0
      ? await rawDb.user.findMany({
          where: { id: { in: actorIds }, tenantId },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  // Resolve targets (one at a time — best-effort, accepts latency for accuracy)
  const result: FeedEvent[] = [];
  for (const event of events) {
    const metadata = (event.metadata ?? {}) as Record<string, unknown>;
    const actorRaw = event.actorId ? actorMap.get(event.actorId) : null;

    const actor: FeedActor | null = actorRaw
      ? {
          id: actorRaw.id,
          name: actorRaw.name ?? actorRaw.email ?? "Usuario",
          role: actorRaw.role,
        }
      : null;

    const target = await resolveTargetLabel(
      event.targetType,
      event.targetId,
      tenantId,
    );

    result.push({
      id: event.id,
      when: event.createdAt,
      actor,
      action: event.action,
      target,
      metadata,
      severity: classifySeverity(event.action, metadata),
    });
  }

  return result;
}

/**
 * Count of sensitive events today — used for sidebar badge.
 */
export async function getSensitiveEventCount(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return rawDb.auditEvent.count({
    where: {
      tenantId: session.user.tenantId,
      action: { in: SENSITIVE_ACTIONS },
      createdAt: { gte: todayStart },
    },
  });
}
