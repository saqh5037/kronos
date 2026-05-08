"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase, withTenant } from "../db";
import { logAudit } from "../audit";
import { sendEmail } from "@/lib/email";
import {
  buildInvitationExpiry,
  isInvitationActionable,
  parseBulkInvitations,
  type ParsedInvitation,
} from "@/lib/athlete-invitation";
import { buildInvitationToken } from "../invitation-token";
import {
  inviteAthleteItemSchema,
  acceptInvitationSchema,
  type InviteAthleteItem,
  type AcceptInvitationInput,
} from "@/lib/validations/athlete-invitation";

async function requireOwnerOrCoach(): Promise<{
  tenantId: string;
  actorId: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Forbidden: solo staff puede invitar atletas");
  }
  return { tenantId: session.user.tenantId, actorId: session.user.id };
}

export type InviteAthletesResult =
  | {
      ok: true;
      created: number;
      skipped: { email: string; reason: string }[];
      errors: { line: number; input: string }[];
    }
  | { ok: false; message: string };

export type ParsePreview = ReturnType<typeof parseBulkInvitations>;

export async function previewInvitations(text: string): Promise<ParsePreview> {
  await requireOwnerOrCoach();
  return parseBulkInvitations(text);
}

export async function inviteAthletesFromText(
  text: string,
): Promise<InviteAthletesResult> {
  const { tenantId, actorId } = await requireOwnerOrCoach();
  const parsed = parseBulkInvitations(text);
  return inviteAthletesInternal(tenantId, actorId, parsed.valid, parsed.errors);
}

export async function inviteAthletes(
  items: InviteAthleteItem[],
): Promise<InviteAthletesResult> {
  const { tenantId, actorId } = await requireOwnerOrCoach();

  const valid: ParsedInvitation[] = [];
  for (const item of items) {
    const r = inviteAthleteItemSchema.safeParse(item);
    if (r.success) {
      valid.push({
        email: r.data.email,
        firstName: r.data.firstName ?? null,
        lastName: r.data.lastName ?? null,
        phone: r.data.phone ?? null,
      });
    }
  }

  return inviteAthletesInternal(tenantId, actorId, valid, []);
}

async function inviteAthletesInternal(
  tenantId: string,
  actorId: string,
  rows: ParsedInvitation[],
  parseErrors: { line: number; input: string }[],
): Promise<InviteAthletesResult> {
  if (rows.length === 0) {
    return { ok: true, created: 0, skipped: [], errors: parseErrors };
  }

  const emails = rows.map((r) => r.email);

  const [existingUsers, existingInvites, box] = await Promise.all([
    prismaBase.user.findMany({
      where: { email: { in: emails }, tenantId },
      select: { email: true, athlete: { select: { id: true } } },
    }),
    prismaBase.athleteInvitation.findMany({
      where: {
        tenantId,
        email: { in: emails },
        acceptedAt: null,
        revokedAt: null,
      },
      select: { email: true, expiresAt: true },
    }),
    prismaBase.box.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true },
    }),
  ]);

  const userByEmail = new Map(existingUsers.map((u) => [u.email, u]));
  const now = new Date();
  const pendingByEmail = new Map(
    existingInvites
      .filter((i) => i.expiresAt.getTime() > now.getTime())
      .map((i) => [i.email, i]),
  );

  const skipped: { email: string; reason: string }[] = [];
  const toCreate: ParsedInvitation[] = [];
  for (const row of rows) {
    const user = userByEmail.get(row.email);
    if (user?.athlete) {
      skipped.push({ email: row.email, reason: "Ya es atleta" });
      continue;
    }
    if (user) {
      skipped.push({ email: row.email, reason: "Email ya registrado" });
      continue;
    }
    if (pendingByEmail.has(row.email)) {
      skipped.push({ email: row.email, reason: "Invitación pendiente" });
      continue;
    }
    toCreate.push(row);
  }

  if (toCreate.length === 0) {
    return { ok: true, created: 0, skipped, errors: parseErrors };
  }

  const expiresAt = buildInvitationExpiry();
  const created = await prismaBase.$transaction(
    toCreate.map((row) =>
      prismaBase.athleteInvitation.create({
        data: {
          tenantId,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          token: buildInvitationToken(),
          expiresAt,
          createdById: actorId,
        },
        select: { id: true, email: true, token: true, firstName: true },
      }),
    ),
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  await Promise.all(
    created.map((inv) =>
      sendEmail({
        to: [inv.email],
        subject: `Te invitamos a unirte a ${box?.name ?? "tu Box"} en Kronos`,
        html: renderInvitationEmail({
          boxName: box?.name ?? "tu Box",
          firstName: inv.firstName ?? null,
          link: `${baseUrl}/invitacion/${inv.token}`,
        }),
      }),
    ),
  );

  for (const inv of created) {
    await logAudit({
      tenantId,
      actorId,
      action: "BOOKING_CREATED",
      targetType: "AthleteInvitation",
      targetId: inv.id,
      metadata: { email: inv.email, kind: "INVITATION_SENT" },
    });
  }

  revalidatePath("/admin/atletas");
  revalidatePath("/admin/atletas/invitar");

  return { ok: true, created: created.length, skipped, errors: parseErrors };
}

export type AcceptInvitationResult =
  | {
      ok: true;
      email: string;
      tenantId: string;
      boxSlug: string;
      athleteId: string;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "EXPIRED" | "ACCEPTED" | "REVOKED" | "VALIDATION";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function getInvitationByToken(token: string) {
  if (!token) return null;
  const inv = await prismaBase.athleteInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      tenantId: true,
      box: { select: { name: true, slug: true, brandColor: true } },
    },
  });
  return inv;
}

export async function acceptInvitation(
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string" && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return {
      ok: false,
      reason: "VALIDATION",
      message: "Revisá los campos",
      fieldErrors,
    };
  }

  const { token, firstName, lastName, phone } = parsed.data;

  const inv = await prismaBase.athleteInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      tenantId: true,
      email: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      box: { select: { slug: true } },
    },
  });
  if (!inv) {
    return {
      ok: false,
      reason: "NOT_FOUND",
      message: "Invitación no encontrada",
    };
  }

  const check = isInvitationActionable(inv);
  if (!check.ok) {
    return {
      ok: false,
      reason: check.reason,
      message:
        check.reason === "EXPIRED"
          ? "La invitación expiró"
          : check.reason === "ACCEPTED"
            ? "La invitación ya fue aceptada"
            : "La invitación fue revocada",
    };
  }

  const result = await prismaBase.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: inv.email },
      select: { id: true, tenantId: true, role: true },
    });
    if (user && user.tenantId !== inv.tenantId) {
      throw new Error("Email registrado en otro Box");
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: inv.email,
          name: lastName ? `${firstName} ${lastName}` : firstName,
          role: "ATHLETE",
          tenantId: inv.tenantId,
        },
        select: { id: true, tenantId: true, role: true },
      });
    }

    let athlete = await tx.athlete.findFirst({
      where: { tenantId: inv.tenantId, userId: user.id },
      select: { id: true },
    });
    if (!athlete) {
      athlete = await tx.athlete.create({
        data: {
          tenantId: inv.tenantId,
          userId: user.id,
          firstName,
          lastName: lastName ?? "",
          phone: phone ?? null,
        },
        select: { id: true },
      });
    }

    await tx.athleteInvitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });

    return { userId: user.id, athleteId: athlete.id };
  });

  await logAudit({
    tenantId: inv.tenantId,
    actorId: result.userId,
    action: "BOOKING_CREATED",
    targetType: "AthleteInvitation",
    targetId: inv.id,
    metadata: {
      kind: "INVITATION_ACCEPTED",
      athleteId: result.athleteId,
      email: inv.email,
    },
  });

  revalidatePath("/admin/atletas");

  return {
    ok: true,
    email: inv.email,
    tenantId: inv.tenantId,
    boxSlug: inv.box.slug,
    athleteId: result.athleteId,
  };
}

export type PendingInvitationRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: Date;
  expiresAt: Date;
  status: "PENDING" | "EXPIRED";
};

export async function listPendingInvitations(): Promise<
  PendingInvitationRow[]
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);
  const rows = await db.athleteInvitation.findMany({
    where: { acceptedAt: null, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const now = new Date();
  return rows.map((r) => ({
    ...r,
    status: r.expiresAt.getTime() <= now.getTime() ? "EXPIRED" : "PENDING",
  }));
}

export async function revokeInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { tenantId, actorId } = await requireOwnerOrCoach();

  const inv = await prismaBase.athleteInvitation.findUnique({
    where: { id },
    select: { tenantId: true, acceptedAt: true, revokedAt: true },
  });
  if (!inv || inv.tenantId !== tenantId) {
    return { ok: false, message: "Invitación no encontrada" };
  }
  if (inv.acceptedAt) {
    return { ok: false, message: "Ya aceptada" };
  }
  if (inv.revokedAt) {
    return { ok: true };
  }

  await prismaBase.athleteInvitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    tenantId,
    actorId,
    action: "BOOKING_CANCELLED",
    targetType: "AthleteInvitation",
    targetId: id,
    metadata: { kind: "INVITATION_REVOKED" },
  });

  revalidatePath("/admin/atletas");
  return { ok: true };
}

export async function resendInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { tenantId } = await requireOwnerOrCoach();

  const inv = await prismaBase.athleteInvitation.findUnique({
    where: { id },
    select: {
      tenantId: true,
      email: true,
      firstName: true,
      token: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      box: { select: { name: true } },
    },
  });
  if (!inv || inv.tenantId !== tenantId) {
    return { ok: false, message: "Invitación no encontrada" };
  }
  if (inv.acceptedAt) return { ok: false, message: "Ya aceptada" };
  if (inv.revokedAt) return { ok: false, message: "Revocada" };

  const newExpiry = buildInvitationExpiry();
  await prismaBase.athleteInvitation.update({
    where: { id },
    data: { expiresAt: newExpiry },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";

  await sendEmail({
    to: [inv.email],
    subject: `Recordatorio: invitación a ${inv.box.name} en Kronos`,
    html: renderInvitationEmail({
      boxName: inv.box.name,
      firstName: inv.firstName,
      link: `${baseUrl}/invitacion/${inv.token}`,
    }),
  });

  revalidatePath("/admin/atletas");
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInvitationEmail(args: {
  boxName: string;
  firstName: string | null;
  link: string;
}): string {
  const greeting = args.firstName
    ? `Hola ${escapeHtml(args.firstName)},`
    : "Hola,";
  const box = escapeHtml(args.boxName);
  const link = args.link;
  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">${greeting}</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      ${box} te invitó a su comunidad en <strong>Kronos</strong> — la app que usan para programar clases, registrar PRs y llevar el seguimiento de tus entrenamientos.
    </p>
    <p style="margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #c8ff2d, #a8d726); color: #08080a; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Aceptar invitación
      </a>
    </p>
    <p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
      Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
      <a href="${link}" style="color: #c8ff2d;">${link}</a>
    </p>
    <p style="font-size: 12px; color: #777; margin-top: 24px;">El link expira en 14 días.</p>
  </div>
</body></html>
`;
}
