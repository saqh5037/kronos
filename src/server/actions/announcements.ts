"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { announcementSchema } from "@/lib/validations/announcement";
import type {
  AnnouncementAudience,
  AnnouncementChannel,
} from "@/lib/validations/announcement";
import { sendEmail } from "@/lib/email";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  channel: AnnouncementChannel;
  status: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  recipientCount: number;
  authorName: string | null;
  createdAt: Date;
};

export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const rows = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Resolve author names
  const authorIds = Array.from(
    new Set(rows.map((r) => r.authorId).filter((id): id is string => !!id)),
  );
  const authors = authorIds.length
    ? await db.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const authorMap = new Map(
    authors.map((a) => [a.id, a.name ?? a.email ?? "—"]),
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience as AnnouncementAudience,
    channel: r.channel as AnnouncementChannel,
    status: r.status,
    scheduledAt: r.scheduledAt,
    sentAt: r.sentAt,
    recipientCount: r.recipientCount,
    authorName: r.authorId ? (authorMap.get(r.authorId) ?? null) : null,
    createdAt: r.createdAt,
  }));
}

/**
 * Resolve target athletes/users for a given audience. Returns email list
 * (de-duped) — used by EMAIL channel. For IN_APP we'd link the announcement
 * to a Notification table (out of scope for Fase 1).
 */
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
    const emails = coaches.map((c) => c.email).filter(Boolean);
    return { count: emails.length, emails };
  }

  // Athlete-bound audiences. Athletes don't always have an email — only those
  // with a linked User account get email delivery; the rest will receive IN_APP
  // when that channel exists.
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

export async function createAnnouncement(data: unknown) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = announcementSchema.parse(data);

  const created = await rawDb.announcement.create({
    data: {
      tenantId,
      authorId: session.user.id,
      title: parsed.title,
      body: parsed.body,
      audience: parsed.audience,
      channel: parsed.channel,
      status: parsed.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: parsed.scheduledAt ?? null,
    },
  });

  revalidatePath("/admin/comunicaciones");
  return { ok: true, id: created.id };
}

/**
 * Send a DRAFT or SCHEDULED announcement. Marks SENDING → SENT/FAILED
 * depending on the result. Uses the mock email sender for now.
 */
export async function sendAnnouncement(id: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const announcement = await db.announcement.findUnique({ where: { id } });
  if (!announcement) throw new Error("Anuncio no encontrado");
  if (announcement.status === "SENT") {
    throw new Error("Este anuncio ya fue enviado");
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
    // IN_APP / PUSH: stub — would create Notification rows / FCM dispatch in Fase 3

    await rawDb.announcement.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        recipientCount: count,
      },
    });

    revalidatePath("/admin/comunicaciones");
    return { ok: true, recipientCount: count };
  } catch (err) {
    await rawDb.announcement.update({
      where: { id },
      data: { status: "FAILED" },
    });
    throw err;
  }
}

export async function deleteAnnouncement(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.announcement.delete({ where: { id } });
  revalidatePath("/admin/comunicaciones");
  return { ok: true };
}
