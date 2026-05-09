"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db as prismaBase } from "../db";
import {
  atletaSignupSchema,
  type AtletaSignupInput,
} from "@/lib/validations/atleta-signup";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  generatePersonalSlug,
  PERSONAL_BOX_NAME,
} from "@/lib/personal-box";
import { STANDARD_MOVEMENTS } from "../../../prisma/seed-movements";

export type AtletaSignupResult =
  | {
      ok: true;
      email: string;
      boxId: string;
      slug: string;
    }
  | {
      ok: false;
      error: "EMAIL_TAKEN" | "VALIDATION" | "RATE_LIMITED" | "UNKNOWN";
      message: string;
      fieldErrors?: Record<string, string>;
    };

const SLUG_RETRY = 3;

export async function createIndependentAthlete(
  input: AtletaSignupInput,
): Promise<AtletaSignupResult> {
  const ip = getClientIp(await headers());
  const rl = rateLimit(`atleta-signup:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      message: `Demasiados intentos. Probá de nuevo en ${rl.retryAfterSec} segundos.`,
    };
  }

  const parsed = atletaSignupSchema.safeParse(input);
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

  const { email, firstName, lastName } = parsed.data;

  const existingUser = await prismaBase.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "EMAIL_TAKEN",
      message: "Ese email ya tiene cuenta — entrá por /login",
      fieldErrors: { email: "Email ya registrado" },
    };
  }

  // Retry slug generation on the (very unlikely) collision: 4 hex bytes = 4.3B combos.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < SLUG_RETRY; attempt++) {
    const slug = generatePersonalSlug();
    try {
      const result = await prismaBase.$transaction(
        async (tx) => {
          const box = await tx.box.create({
            data: {
              slug,
              name: PERSONAL_BOX_NAME,
              subscriptionStatus: "TRIAL",
            },
            select: { id: true, slug: true },
          });
          const user = await tx.user.create({
            data: {
              email,
              name: firstName,
              role: "ATHLETE",
              tenantId: box.id,
            },
            select: { id: true },
          });
          await tx.athlete.create({
            data: {
              tenantId: box.id,
              userId: user.id,
              firstName,
              lastName: lastName ?? "",
            },
          });
          await tx.movement.createMany({
            data: STANDARD_MOVEMENTS.map((m) => ({
              tenantId: box.id,
              name: m.name,
              slug: m.slug,
              category: m.category,
              isStandard: true,
              videoUrl: m.videoUrl,
              standardDescription: m.standardDescription,
              equipment: m.equipment,
            })),
            skipDuplicates: true,
          });
          return box;
        },
        { timeout: 15_000 },
      );

      return {
        ok: true,
        email,
        boxId: result.id,
        slug: result.slug,
      };
    } catch (e) {
      lastError = e;
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target = (e.meta?.target as string[] | undefined) ?? [];
        if (target.some((t) => t.toLowerCase().includes("email"))) {
          return {
            ok: false,
            error: "EMAIL_TAKEN",
            message: "Ese email ya tiene cuenta — entrá por /login",
            fieldErrors: { email: "Email ya registrado" },
          };
        }
        // slug collision — retry with new slug
        if (target.some((t) => t.toLowerCase().includes("slug"))) {
          continue;
        }
      }
      throw e;
    }
  }

  console.error("[atleta-signup] slug retry exhausted:", lastError);
  return {
    ok: false,
    error: "UNKNOWN",
    message: "No pudimos crear tu cuenta. Probá de nuevo en un momento.",
  };
}
