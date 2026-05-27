"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db as prismaBase } from "../db";
import {
  foundingReservationSchema,
  type FoundingReservationInput,
} from "@/lib/validations/founding-dominus";
import { TRIAL_DURATION_DAYS } from "@/lib/validations/signup";
import { isDominusPromoActive, PROMO_PLAN_SLUG } from "@/lib/dominus-promo";
import { sendEmail } from "@/lib/email";
import { renderFoundingReservationEmail } from "@/server/email-templates/founding-reservation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isPersonalBoxSlug } from "@/lib/personal-box";

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
  "pricing",
  "signup",
  "support",
  "tv",
  "www",
]);

export type FoundingReservationResult =
  | {
      ok: true;
      boxId: string;
      slug: string;
      email: string;
      trialEndsAt: Date;
      billingCycle: "monthly" | "annual";
    }
  | {
      ok: false;
      error:
        | "PROMO_CLOSED"
        | "EMAIL_TAKEN"
        | "SLUG_TAKEN"
        | "SLUG_RESERVED"
        | "PLAN_NOT_FOUND"
        | "VALIDATION"
        | "RATE_LIMITED";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function reserveFoundingPlan(
  input: FoundingReservationInput,
): Promise<FoundingReservationResult> {
  // Honeypot — si el bot rellenó el campo oculto, devolver fake-success
  // sin tocar DB ni enviar email. El bot cree que ganó y se va.
  if (input.website && input.website.length > 0) {
    const hdrs = await headers();
    const ipPrefix = getClientIp(hdrs).split(".").slice(0, 2).join(".");
    console.warn(`[founding-dominus] honeypot triggered ip=${ipPrefix}.x.x`);
    const fakeTrialEnd = new Date(
      Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );
    return {
      ok: true,
      boxId: "honeypot-rejected",
      slug: input.slug ?? "honeypot",
      email: input.email ?? "honeypot@example.com",
      trialEndsAt: fakeTrialEnd,
      billingCycle: input.billingCycle ?? "monthly",
    };
  }

  // Rate limit por IP — protege Resend + DB durante el evento.
  // 5 reservas/min/IP es generoso para uso humano y bloquea bots.
  const ip = getClientIp(await headers());
  const rl = rateLimit(`founding:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      message: `Demasiados intentos. Prueba de nuevo en ${rl.retryAfterSec} segundos.`,
    };
  }

  if (!isDominusPromoActive()) {
    return {
      ok: false,
      error: "PROMO_CLOSED",
      message:
        "La oferta Founding Dominus se cerró. Escríbenos a contacto@kronos-fit.com para próximas promociones.",
    };
  }

  const parsed = foundingReservationSchema.safeParse(input);
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

  const { email, ownerName, boxName, slug, billingCycle, phone } = parsed.data;

  if (RESERVED_SLUGS.has(slug) || isPersonalBoxSlug(slug)) {
    return {
      ok: false,
      error: "SLUG_RESERVED",
      message: "Ese slug está reservado, elige otro",
      fieldErrors: { slug: "Slug reservado" },
    };
  }

  const { disciplineSlug } = parsed.data;

  const [existingBox, existingUser, plan, discipline] = await Promise.all([
    prismaBase.box.findUnique({ where: { slug }, select: { id: true } }),
    prismaBase.user.findUnique({ where: { email }, select: { id: true } }),
    prismaBase.saasPlan.findUnique({
      where: { slug: PROMO_PLAN_SLUG },
      select: { id: true, priceMxnCents: true },
    }),
    prismaBase.discipline.findUnique({
      where: { slug: disciplineSlug },
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
  if (!plan) {
    return {
      ok: false,
      error: "PLAN_NOT_FOUND",
      message:
        "No encontramos el plan Founding. Si sigues acá, escríbenos a contacto@kronos-fit.com.",
    };
  }

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  // Auto-activar feature hyrox cuando la disciplina elegida es hyrox.
  // Mismo patrón que pilot-onboarding (createPilotBox).
  const features: Record<string, boolean> = {};
  if (disciplineSlug === "hyrox") features.hyrox = true;

  let result: { id: string; slug: string };
  try {
    result = await prismaBase.$transaction(async (tx) => {
      const box = await tx.box.create({
        data: {
          slug,
          name: boxName,
          subscriptionStatus: "TRIAL",
          trialStartedAt: now,
          trialEndsAt,
          // Si discipline no existe o no está activa, dejamos disciplineId
          // nulo (igual que Boxes pre-F1.1). Backfill via super-admin tool.
          disciplineId:
            discipline && discipline.isActive ? discipline.id : null,
          features: features as Prisma.InputJsonValue,
        },
        select: { id: true, slug: true },
      });
      await tx.user.create({
        data: {
          email,
          name: ownerName,
          role: "OWNER",
          tenantId: box.id,
        },
      });
      await tx.saasSubscription.create({
        data: {
          tenantId: box.id,
          planId: plan.id,
          status: "PENDING",
        },
      });
      return box;
    });
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
      return {
        ok: false,
        error: "EMAIL_TAKEN",
        message:
          "Ya tenemos tu reserva — revisa tu correo o escríbenos a contacto@kronos-fit.com",
      };
    }
    throw e;
  }

  // Email de confirmación de reserva — fuera de la transacción, no bloqueante.
  // Si Resend falla, la reserva ya quedó persistida y el cliente dispara
  // su magic link aparte; loggeamos para investigación posterior.
  try {
    await sendEmail({
      to: [email],
      subject: "Tu Founding Box Dominus está reservado",
      html: renderFoundingReservationEmail({
        ownerName,
        email,
        boxName,
        slug: result.slug,
        billingCycle,
        priceMxnCents: plan.priceMxnCents,
        trialEndsAt,
      }),
    });
  } catch (e) {
    console.error(`[founding-dominus] email failed box=${result.slug}:`, e);
  }

  // Log no-PII: slug + ciclo + si traía teléfono (sin email ni teléfono en claro).
  console.log(
    `[founding-dominus] reserved box=${result.slug} cycle=${billingCycle} hasPhone=${Boolean(phone)}`,
  );

  return {
    ok: true,
    boxId: result.id,
    slug: result.slug,
    email,
    trialEndsAt,
    billingCycle,
  };
}
