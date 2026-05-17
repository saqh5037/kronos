"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isSuperAdmin } from "@/lib/super-admin";

/**
 * Gate dedicado para server actions de super-admin.
 *
 * IMPORTANTE: Las server actions con `"use server"` son endpoints HTTP
 * públicos invocables por cualquier sesión válida — el layout `/admin/super/*`
 * que llama notFound() protege el RENDER de la page, NO al RPC de las
 * actions importadas. Cada server action sensible debe validar por sí misma.
 *
 * Devuelve `{ ok: false, error: "UNAUTHORIZED" }` para que los callers
 * tipen el resultado de forma consistente.
 */
async function requireSuperAdmin(): Promise<
  true | { ok: false; error: "UNAUTHORIZED" }
> {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email)) {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  return true;
}

/**
 * Tipo retornado por listPilotBoxes — métricas agregadas por Box piloto.
 *
 * Diseño:
 * - Filtro de "es piloto" = Box.pilotExclusivityExpiresAt is not null.
 *   Esto distingue Boxes curados via wizard F1.7 de signups orgánicos
 *   founding-dominus.
 * - Días calculados como diff vs `now` server-side (sin reactividad cliente).
 *   Si Samuel quiere refresh exacto, recarga la page.
 */
export type PilotBoxRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string;
  disciplineName: string | null;
  disciplineSlug: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  subscriptionStatus: string;

  trialEndsAt: Date | null;
  trialDaysLeft: number | null; // null si no hay trial activo o ya vencido (negativo)

  pilotExclusivityExpiresAt: Date | null;
  exclusivityDaysLeft: number | null;

  pilotBetaSignedAt: Date | null;

  athleteCount: number;
  wodCount: number;
  pushSubscriptionCount: number;

  createdAt: Date;
};

function daysBetween(future: Date, now: Date): number {
  const ms = future.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Lista Box pilotos ordenados por createdAt desc (más recientes primero).
 *
 * Defensa en profundidad: además del layout `/admin/super/*` que renderiza
 * notFound() para no-super-admins, esta action revalida la sesión porque
 * server actions son endpoints RPC invocables independientes del page que
 * las importa.
 *
 * Retorna `[]` si el caller no es super-admin (preserva semántica del
 * page que renderiza EmptyState ante lista vacía — no leak de existencia).
 */
export async function listPilotBoxes(
  now: Date = new Date(),
): Promise<PilotBoxRow[]> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return [];

  const boxes = await prismaBase.box.findMany({
    where: {
      pilotExclusivityExpiresAt: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      country: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      pilotExclusivityExpiresAt: true,
      pilotBetaSignedAt: true,
      createdAt: true,
      discipline: { select: { slug: true, name: true } },
      users: {
        where: { role: "OWNER" },
        select: { email: true, name: true },
        take: 1,
      },
      _count: {
        select: {
          athletes: true,
          wods: true,
        },
      },
    },
  });

  if (boxes.length === 0) return [];

  // Push subscriptions: count separado porque la relation es a través de User
  // y Prisma no expone count directo desde Box. Lo agregamos en una query.
  const pushCounts = await prismaBase.pushSubscription.groupBy({
    by: ["tenantId"],
    where: { tenantId: { in: boxes.map((b) => b.id) } },
    _count: { _all: true },
  });
  const pushByTenant = new Map(
    pushCounts.map((p) => [p.tenantId, p._count._all]),
  );

  return boxes.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    city: b.city,
    country: b.country,
    disciplineName: b.discipline?.name ?? null,
    disciplineSlug: b.discipline?.slug ?? null,
    ownerEmail: b.users[0]?.email ?? null,
    ownerName: b.users[0]?.name ?? null,
    subscriptionStatus: b.subscriptionStatus,
    trialEndsAt: b.trialEndsAt,
    trialDaysLeft:
      b.trialEndsAt && b.trialEndsAt > now
        ? daysBetween(b.trialEndsAt, now)
        : null,
    pilotExclusivityExpiresAt: b.pilotExclusivityExpiresAt,
    exclusivityDaysLeft:
      b.pilotExclusivityExpiresAt && b.pilotExclusivityExpiresAt > now
        ? daysBetween(b.pilotExclusivityExpiresAt, now)
        : null,
    pilotBetaSignedAt: b.pilotBetaSignedAt,
    athleteCount: b._count.athletes,
    wodCount: b._count.wods,
    pushSubscriptionCount: pushByTenant.get(b.id) ?? 0,
    createdAt: b.createdAt,
  }));
}

/**
 * Genera token piloto-beta server-side. Wrapper que también valida que
 * el Box exista + esté marcado como piloto (defensa anti-misuso desde UI).
 *
 * Se invoca desde el botón "Copiar magic link" del dashboard.
 */
export async function generatePilotBetaTokenForBox(args: {
  boxId: string;
  expiresInSec?: number;
}): Promise<
  | { ok: true; url: string; expiresAt: Date }
  | {
      ok: false;
      error: "UNAUTHORIZED" | "BOX_NOT_FOUND" | "NOT_PILOT" | "MISSING_SECRET";
    }
> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return gate;

  const { signPilotBetaToken } = await import("@/lib/pilot-beta-token");
  const expiresInSec = args.expiresInSec ?? 7 * 24 * 60 * 60;

  const box = await prismaBase.box.findUnique({
    where: { id: args.boxId },
    select: { id: true, pilotExclusivityExpiresAt: true },
  });
  if (!box) return { ok: false, error: "BOX_NOT_FOUND" };
  if (!box.pilotExclusivityExpiresAt) return { ok: false, error: "NOT_PILOT" };

  let token: string;
  try {
    token = signPilotBetaToken({ boxId: box.id, expiresInSec });
  } catch {
    return { ok: false, error: "MISSING_SECRET" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kronos-fit.com";
  const url = `${baseUrl}/piloto-beta?token=${token}`;
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  return { ok: true, url, expiresAt };
}
