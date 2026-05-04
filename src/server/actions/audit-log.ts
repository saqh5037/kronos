"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import type { AuditAction } from "@prisma/client";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type AuditEventRow = {
  id: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export async function listAuditEvents(opts?: {
  targetType?: string;
  targetId?: string;
  action?: AuditAction;
  limit?: number;
}): Promise<AuditEventRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const events = await db.auditEvent.findMany({
    where: {
      ...(opts?.targetType ? { targetType: opts.targetType } : {}),
      ...(opts?.targetId ? { targetId: opts.targetId } : {}),
      ...(opts?.action ? { action: opts.action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });

  // Resolve actor names
  const actorIds = Array.from(
    new Set(events.map((e) => e.actorId).filter((id): id is string => !!id)),
  );
  const actors = actorIds.length
    ? await db.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.name ?? a.email ?? "—"]));

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    actorId: e.actorId,
    actorName: e.actorId ? (actorMap.get(e.actorId) ?? null) : null,
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
    createdAt: e.createdAt,
  }));
}
