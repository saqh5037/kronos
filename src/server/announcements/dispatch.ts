/**
 * Dispatch logic shared between the user-triggered sendAnnouncement (server
 * action) and the cron endpoint /api/cron/dispatch-announcements.
 *
 * Cero acoplamiento con next-auth: recibe tenantId + announcementId como args,
 * usa prismaBase + withTenant directamente.
 */

import { db as rawDb, withTenant } from "../db";
import { sendEmail } from "@/lib/email";
import type { AnnouncementAudience } from "@/lib/validations/announcement";

export type DispatchResult = {
  id: string;
  status: "SENT" | "FAILED";
  recipientCount: number;
  error?: string;
};

async function resolveAudience(
  tenantId: string,
  audience: AnnouncementAudience,
): Promise<{ count: number; emails: string[] }> {
  const db = withTenant(tenantId);

  if (audience === "COACHES") {
    const coaches = await db.user.findMany({
      where: { role: { in: ["COACH", "OWNER"] } },
      select: { email: true },
    });
    return {
      count: coaches.length,
      emails: coaches.map((c) => c.email).filter(Boolean),
    };
  }

  const statusFilter =
    audience === "ACTIVE"
      ? { status: "ACTIVE" as const }
      : audience === "PAUSED"
        ? { status: "PAUSED" as const }
        : {};

  const athletes = await db.athlete.findMany({
    where: statusFilter,
    select: { id: true, user: { select: { email: true } } },
  });
  const emails = athletes
    .map((a) => a.user?.email)
    .filter((e): e is string => !!e);

  return { count: athletes.length, emails: Array.from(new Set(emails)) };
}

/**
 * Dispatch a single announcement by id. Marks SENDING → SENT/FAILED.
 * Returns DispatchResult — never throws (errors get persisted as FAILED).
 */
export async function dispatchAnnouncement(
  tenantId: string,
  id: string,
): Promise<DispatchResult> {
  const announcement = await rawDb.announcement.findFirst({
    where: { id, tenantId },
  });
  if (!announcement) {
    return {
      id,
      status: "FAILED",
      recipientCount: 0,
      error: "Announcement not found",
    };
  }
  if (announcement.status === "SENT") {
    return {
      id,
      status: "SENT",
      recipientCount: announcement.recipientCount,
    };
  }

  await rawDb.announcement.update({
    where: { id },
    data: { status: "SENDING" },
  });

  try {
    const { count, emails } = await resolveAudience(
      tenantId,
      announcement.audience as AnnouncementAudience,
    );

    if (announcement.channel === "EMAIL" && emails.length > 0) {
      await sendEmail({
        to: emails,
        subject: announcement.title,
        html: `<p>${announcement.body.replace(/\n/g, "<br/>")}</p>`,
      });
    }

    await rawDb.announcement.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        recipientCount: count,
      },
    });

    return { id, status: "SENT", recipientCount: count };
  } catch (err) {
    await rawDb.announcement.update({
      where: { id },
      data: { status: "FAILED" },
    });
    return {
      id,
      status: "FAILED",
      recipientCount: 0,
      error: err instanceof Error ? err.message : "Unknown dispatch error",
    };
  }
}

/**
 * Find all SCHEDULED announcements past their scheduledAt across ALL tenants
 * and dispatch each one. Used by the cron endpoint.
 */
export async function dispatchAllScheduled(now: Date = new Date()): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: DispatchResult[];
}> {
  const due = await rawDb.announcement.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    select: { id: true, tenantId: true },
    take: 100, // bound batch
  });

  const results: DispatchResult[] = [];
  for (const a of due) {
    results.push(await dispatchAnnouncement(a.tenantId, a.id));
  }

  return {
    total: due.length,
    sent: results.filter((r) => r.status === "SENT").length,
    failed: results.filter((r) => r.status === "FAILED").length,
    results,
  };
}
