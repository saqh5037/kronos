"use server";

import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "../db";
import {
  pilotOnboardingSchema,
  type PilotOnboardingInput,
  type PilotDisciplineSlug,
} from "@/lib/validations/pilot-onboarding";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { isSuperAdmin } from "@/lib/super-admin";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "atleta",
  "auth",
  "billing",
  "dev",
  "founding-dominus",
  "kronos",
  "login",
  "logout",
  "onboarding",
  "piloto-beta",
  "pricing",
  "signup",
  "super",
  "support",
  "tv",
  "www",
]);

export type PilotOnboardingResult =
  | {
      ok: true;
      boxId: string;
      slug: string;
      ownerEmail: string;
      ownerUserId: string;
      disciplineSlug: PilotDisciplineSlug;
      trialEndsAt: Date;
      pilotExclusivityExpiresAt: Date | null;
    }
  | {
      ok: false;
      error:
        | "UNAUTHORIZED"
        | "EMAIL_TAKEN"
        | "SLUG_TAKEN"
        | "SLUG_RESERVED"
        | "DISCIPLINE_NOT_FOUND"
        | "VALIDATION"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string>;
    };

/**
 * Crea un Box piloto manualmente desde el wizard super-admin.
 *
 * Diferencias vs `reserveFoundingPlan`:
 * - Sin promo gate (no requiere isDominusPromoActive)
 * - Sin SaasSubscription PENDING (los pilotos no tienen subscription
 *   formal hasta convertir a paid después del trial)
 * - Sin email Resend (Samuel mandará magic link manual o por wizard step
 *   futuro)
 * - Soporta disciplina (crossfit | hyrox) + geo + exclusividad +
 *   feature flags
 * - Solo accesible para super-admins (gate por env SUPER_ADMIN_EMAILS)
 */
export async function createPilotBox(
  input: PilotOnboardingInput,
): Promise<PilotOnboardingResult> {
  // ─── Auth gate ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email)) {
    return {
      ok: false,
      error: "UNAUTHORIZED",
      message: "Acceso restringido a super-admins",
    };
  }

  // ─── Honeypot ───────────────────────────────────────────────────────────────
  if (input.website && input.website.length > 0) {
    console.warn(
      `[pilot-onboarding] honeypot triggered email=${input.email ?? "?"}`,
    );
    return {
      ok: false,
      error: "INTERNAL",
      message: "No se pudo procesar la solicitud",
    };
  }

  // ─── Schema validation ──────────────────────────────────────────────────────
  const parsed = pilotOnboardingSchema.safeParse(input);
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
      error: "VALIDATION",
      message: "Revisa los campos del formulario",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // ─── Slug reservation ───────────────────────────────────────────────────────
  if (RESERVED_SLUGS.has(data.slug) || isPersonalBoxSlug(data.slug)) {
    return {
      ok: false,
      error: "SLUG_RESERVED",
      message: "Ese slug está reservado, elige otro",
      fieldErrors: { slug: "Slug reservado" },
    };
  }

  // ─── Lookups pre-write ──────────────────────────────────────────────────────
  const [existingBox, existingUser, discipline] = await Promise.all([
    prismaBase.box.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    }),
    prismaBase.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    }),
    prismaBase.discipline.findUnique({
      where: { slug: data.disciplineSlug },
      select: { id: true, isActive: true },
    }),
  ]);

  if (existingBox) {
    return {
      ok: false,
      error: "SLUG_TAKEN",
      message: "Ese slug ya está en uso",
      fieldErrors: { slug: "Ya hay un box con ese slug" },
    };
  }
  if (existingUser) {
    return {
      ok: false,
      error: "EMAIL_TAKEN",
      message: "Ese email ya tiene una cuenta",
      fieldErrors: { email: "Email ya registrado" },
    };
  }
  if (!discipline || !discipline.isActive) {
    return {
      ok: false,
      error: "DISCIPLINE_NOT_FOUND",
      message: `Disciplina '${data.disciplineSlug}' no encontrada o inactiva`,
    };
  }

  // ─── Compute timestamps ─────────────────────────────────────────────────────
  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + data.trialDurationDays * 24 * 60 * 60 * 1000,
  );
  const pilotExclusivityExpiresAt =
    data.exclusivityDays > 0
      ? new Date(now.getTime() + data.exclusivityDays * 24 * 60 * 60 * 1000)
      : null;

  // Feature flags whitelisted — solo set los explícitos al true,
  // omitir false para mantener Box.features compacto.
  // Auto-activar hyrox feature si disciplina=hyrox (sin esto, el editor
  // Hyrox no renderizaría — el checkbox manual es para CrossFit Boxes
  // que quieren testear Hyrox features sin migrar discipline).
  const features: Record<string, boolean> = {};
  if (data.disciplineSlug === "hyrox" || data.enableHyroxUI) {
    features.hyrox = true;
  }
  if (data.enableMmAthlete) features.mm_athlete = true;

  // ─── Transaction: Box + User OWNER ──────────────────────────────────────────
  try {
    const result = await prismaBase.$transaction(async (tx) => {
      const box = await tx.box.create({
        data: {
          slug: data.slug,
          name: data.boxName,
          subscriptionStatus: "TRIAL",
          trialStartedAt: now,
          trialEndsAt,
          disciplineId: discipline.id,
          country: data.country,
          city: data.city,
          region: data.region || null,
          pilotExclusivityExpiresAt,
          features: features as Prisma.InputJsonValue,
        },
        select: { id: true, slug: true },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.ownerName,
          role: "OWNER",
          tenantId: box.id,
        },
        select: { id: true },
      });

      return { box, user };
    });

    return {
      ok: true,
      boxId: result.box.id,
      slug: result.box.slug,
      ownerEmail: data.email,
      ownerUserId: result.user.id,
      disciplineSlug: data.disciplineSlug,
      trialEndsAt,
      pilotExclusivityExpiresAt,
    };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const target = (e.meta?.target as string[] | undefined) ?? [];
      if (target.some((t) => t.toLowerCase().includes("email"))) {
        return {
          ok: false,
          error: "EMAIL_TAKEN",
          message: "Ese email ya tiene una cuenta",
          fieldErrors: { email: "Email ya registrado" },
        };
      }
      if (target.some((t) => t.toLowerCase().includes("slug"))) {
        return {
          ok: false,
          error: "SLUG_TAKEN",
          message: "Ese slug ya está en uso",
          fieldErrors: { slug: "Ya hay un box con ese slug" },
        };
      }
    }
    console.error("[pilot-onboarding] unexpected error:", e);
    return {
      ok: false,
      error: "INTERNAL",
      message: "Error inesperado, intenta nuevamente o avísame",
    };
  }
}
