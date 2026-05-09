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
  // Rate limit por IP — protege Resend + DB durante el evento.
  // 5 reservas/min/IP es generoso para uso humano y bloquea bots.
  const ip = getClientIp(await headers());
  const rl = rateLimit(`founding:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      message: `Demasiados intentos. Probá de nuevo en ${rl.retryAfterSec} segundos.`,
    };
  }

  if (!isDominusPromoActive()) {
    return {
      ok: false,
      error: "PROMO_CLOSED",
      message:
        "La oferta Founding Dominus se cerró. Escribinos a contacto@kronos-fit.com para próximas promociones.",
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
      message: "Revisá los campos del formulario",
      fieldErrors,
    };
  }

  const { email, ownerName, boxName, slug, billingCycle, phone } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) {
    return {
      ok: false,
      error: "SLUG_RESERVED",
      message: "Ese slug está reservado, elegí otro",
      fieldErrors: { slug: "Slug reservado" },
    };
  }

  const [existingBox, existingUser, plan] = await Promise.all([
    prismaBase.box.findUnique({ where: { slug }, select: { id: true } }),
    prismaBase.user.findUnique({ where: { email }, select: { id: true } }),
    prismaBase.saasPlan.findUnique({
      where: { slug: PROMO_PLAN_SLUG },
      select: { id: true, priceMxnCents: true },
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
        "No encontramos el plan Founding. Si seguís acá, escribinos a contacto@kronos-fit.com.",
    };
  }

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

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
          "Ya tenemos tu reserva — revisá tu correo o escribinos a contacto@kronos-fit.com",
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
    console.error(
      `[founding-dominus] email failed box=${result.slug} email=${email}:`,
      e,
    );
  }

  // Log con detalle solo en server (no expuesto al cliente)
  if (phone) {
    console.log(
      `[founding-dominus] reserved box=${result.slug} email=${email} cycle=${billingCycle} phone=${phone}`,
    );
  }

  return {
    ok: true,
    boxId: result.id,
    slug: result.slug,
    email,
    trialEndsAt,
    billingCycle,
  };
}
