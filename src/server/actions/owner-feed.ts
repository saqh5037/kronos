"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import type { AuditAction } from "@prisma/client";
import { humanizeAuditEvent, type AuditCategory } from "@/lib/audit-humanize";

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
  label: string;
  category: AuditCategory;
};

// Actions usadas para count del badge en sidebar (sin metadata.kind context)
const SENSITIVE_ACTIONS: AuditAction[] = [
  "PAYMENT_VOIDED",
  "PAYMENT_REGISTERED",
  "MEMBERSHIP_CANCELLED",
];

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

    if (targetType === "SaasSubscription") {
      const sub = await rawDb.saasSubscription.findFirst({
        where: { id: targetId, tenantId },
        select: { plan: { select: { name: true } } },
      });
      if (sub) {
        return {
          type: targetType,
          label: `Suscripción · plan ${sub.plan.name}`,
          link: `${baseLink}/billing`,
        };
      }
    }

    if (targetType === "Box") {
      return {
        type: targetType,
        label: "Configuración del Box",
        link: `${baseLink}/ajustes`,
      };
    }

    if (targetType === "AthleteInvitation") {
      const inv = await rawDb.athleteInvitation.findFirst({
        where: { id: targetId, tenantId },
        select: { email: true, firstName: true, lastName: true },
      });
      if (inv) {
        const fullName = [inv.firstName, inv.lastName]
          .filter(Boolean)
          .join(" ");
        return {
          type: targetType,
          label: fullName ? `${fullName} · ${inv.email}` : inv.email,
          link: `${baseLink}/atletas/invitar`,
        };
      }
    }

    if (targetType === "StaffInvitation") {
      const inv = await rawDb.staffInvitation.findFirst({
        where: { id: targetId, tenantId },
        select: { email: true, name: true, role: true },
      });
      if (inv) {
        const roleLabel = inv.role === "COACH" ? "Coach" : "Staff";
        return {
          type: targetType,
          label: inv.name
            ? `${inv.name} · ${roleLabel} · ${inv.email}`
            : `${roleLabel} · ${inv.email}`,
          link: `${baseLink}/onboarding`,
        };
      }
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
  category?: AuditCategory;
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

    const humanized = humanizeAuditEvent({
      action: event.action,
      metadata,
      targetType: event.targetType,
    });

    if (opts?.category && humanized.category !== opts.category) continue;

    result.push({
      id: event.id,
      when: event.createdAt,
      actor,
      action: event.action,
      target,
      metadata,
      severity: humanized.severity,
      label: humanized.label,
      category: humanized.category,
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
