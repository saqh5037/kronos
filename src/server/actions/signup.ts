"use server";

import { db as prismaBase } from "../db";
import { seedDefaultMovements } from "../seed-defaults";
import {
  signupSchema,
  TRIAL_DURATION_DAYS,
  type SignupInput,
} from "@/lib/validations/signup";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "atleta",
  "auth",
  "billing",
  "dev",
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

export type SignupResult =
  | {
      ok: true;
      boxId: string;
      slug: string;
      email: string;
      trialEndsAt: Date;
    }
  | {
      ok: false;
      error: "EMAIL_TAKEN" | "SLUG_TAKEN" | "SLUG_RESERVED" | "VALIDATION";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function createBoxAndOwner(
  input: SignupInput,
): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
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

  const { email, ownerName, boxName, slug } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) {
    return {
      ok: false,
      error: "SLUG_RESERVED",
      message: "Ese slug está reservado, elegí otro",
      fieldErrors: { slug: "Slug reservado" },
    };
  }

  const [existingBox, existingUser] = await Promise.all([
    prismaBase.box.findUnique({ where: { slug }, select: { id: true } }),
    prismaBase.user.findUnique({ where: { email }, select: { id: true } }),
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

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  const result = await prismaBase.$transaction(
    async (tx) => {
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
      await seedDefaultMovements(tx, box.id);
      return box;
    },
    { timeout: 15_000 },
  );

  return {
    ok: true,
    boxId: result.id,
    slug: result.slug,
    email,
    trialEndsAt,
  };
}
