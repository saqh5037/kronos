"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "../db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { sendEmail } from "@/lib/email";
import {
  withReplacedTag,
  UNIT_TAG_PREFIX,
  LEVEL_TAG_PREFIX,
  type Unit,
  type Level,
} from "@/lib/atleta-prefs";

export type OnboardingInput = {
  firstName?: string;
  lastName?: string;
  unit?: Unit | null;
  level?: Level | null;
  joinBoxSlug?: string | null;
};

export type OnboardingResult =
  | { ok: true; joinedBoxRequested: boolean; joinBoxName?: string }
  | {
      ok: false;
      error: "UNAUTH" | "NOT_FOUND" | "BOX_NOT_FOUND" | "BOX_INVALID";
      message: string;
    };

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, error: "UNAUTH", message: "Sesión expirada" };
  }
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const athlete = await prismaBase.athlete.findFirst({
    where: { tenantId, userId },
    select: { id: true, tags: true, firstName: true, lastName: true },
  });
  if (!athlete) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "No encontramos tu atleta",
    };
  }

  let nextTags = athlete.tags;
  if (input.unit !== undefined) {
    nextTags = withReplacedTag(nextTags, UNIT_TAG_PREFIX, input.unit);
  }
  if (input.level !== undefined) {
    nextTags = withReplacedTag(nextTags, LEVEL_TAG_PREFIX, input.level);
  }

  const profileUpdate: {
    firstName?: string;
    lastName?: string;
    tags?: string[];
  } = {
    tags: nextTags,
  };
  if (input.firstName !== undefined && input.firstName.trim().length >= 2) {
    profileUpdate.firstName = input.firstName.trim();
  }
  if (input.lastName !== undefined && input.lastName.trim().length >= 2) {
    profileUpdate.lastName = input.lastName.trim();
  }

  let joinedBoxRequested = false;
  let joinBoxName: string | undefined;
  if (input.joinBoxSlug && input.joinBoxSlug.trim().length > 0) {
    const slug = input.joinBoxSlug.trim().toLowerCase();
    if (isPersonalBoxSlug(slug)) {
      return {
        ok: false,
        error: "BOX_INVALID",
        message: "Ese código no es válido",
      };
    }
    const targetBox = await prismaBase.box.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        users: {
          where: { role: "OWNER" },
          select: { email: true, name: true },
          take: 1,
        },
      },
    });
    if (!targetBox) {
      return {
        ok: false,
        error: "BOX_NOT_FOUND",
        message: "No encontramos un box con ese código",
      };
    }
    joinedBoxRequested = true;
    joinBoxName = targetBox.name;

    const owner = targetBox.users[0];
    if (owner?.email) {
      try {
        await sendEmail({
          to: [owner.email],
          subject: `Solicitud para unirse a ${targetBox.name}`,
          html: renderJoinRequestEmail({
            ownerName: owner.name ?? "Coach",
            athleteName:
              `${profileUpdate.firstName ?? athlete.firstName} ${profileUpdate.lastName ?? athlete.lastName}`.trim(),
            athleteEmail: session.user.email ?? "(sin email)",
            boxName: targetBox.name,
          }),
        });
      } catch (e) {
        console.error("[atleta-onboarding] join-request email failed:", e);
      }
    }
  }

  const now = new Date();
  await prismaBase.$transaction([
    prismaBase.athlete.update({
      where: { id: athlete.id },
      data: { ...profileUpdate, onboardingCompletedAt: now },
    }),
    prismaBase.box.update({
      where: { id: tenantId },
      data: { onboardingCompletedAt: now },
    }),
  ]);

  return { ok: true, joinedBoxRequested, joinBoxName };
}

export async function markOnboardingCompleted(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, message: "Sesión expirada" };
  }
  const now = new Date();
  await prismaBase.$transaction([
    prismaBase.athlete.updateMany({
      where: { tenantId: session.user.tenantId, userId: session.user.id },
      data: { onboardingCompletedAt: now },
    }),
    prismaBase.box.update({
      where: { id: session.user.tenantId },
      data: { onboardingCompletedAt: now },
    }),
  ]);
  return { ok: true };
}

function renderJoinRequestEmail(args: {
  ownerName: string;
  athleteName: string;
  athleteEmail: string;
  boxName: string;
}): string {
  return `
<!doctype html>
<html>
  <body style="font-family:system-ui,-apple-system,sans-serif;background:#08080a;color:#f5f5f7;padding:32px;">
    <div style="max-width:520px;margin:0 auto;background:#0f1014;border:1px solid #1c1c24;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;margin:0 0 16px;color:#c8ff2d;">Nuevo atleta quiere unirse</h1>
      <p style="margin:0 0 12px;line-height:1.6;color:#f5f5f7;">Hola ${args.ownerName},</p>
      <p style="margin:0 0 12px;line-height:1.6;color:#8a8a94;">
        <strong style="color:#f5f5f7;">${args.athleteName}</strong> (${args.athleteEmail})
        solicitó unirse a tu box <strong style="color:#f5f5f7;">${args.boxName}</strong> desde Kronos.
      </p>
      <p style="margin:0 0 24px;line-height:1.6;color:#8a8a94;">
        Para agregarlo, ingresá a tu panel admin y mandale una invitación o respondé a este email para coordinar.
      </p>
      <p style="margin:0;font-size:12px;color:#54545c;">Kronos · kronos-fit.com</p>
    </div>
  </body>
</html>`.trim();
}
