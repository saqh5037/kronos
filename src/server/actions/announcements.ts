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
import { dispatchAnnouncement } from "../announcements/dispatch";

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
 * Send a DRAFT or SCHEDULED announcement now. Delegates the side-effects to
 * dispatchAnnouncement so the cron endpoint reuses the same path.
 */
export async function sendAnnouncement(id: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;

  const result = await dispatchAnnouncement(tenantId, id);
  revalidatePath("/admin/comunicaciones");

  if (result.status === "FAILED") {
    throw new Error(result.error ?? "Falló el envío");
  }
  return { ok: true, recipientCount: result.recipientCount };
}

export async function deleteAnnouncement(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.announcement.delete({ where: { id } });
  revalidatePath("/admin/comunicaciones");
  return { ok: true };
}
