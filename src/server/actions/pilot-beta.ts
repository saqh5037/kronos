"use server";

import { headers } from "next/headers";
import { db as prismaBase } from "@/server/db";
import { logAudit } from "@/server/audit";
import { verifyPilotBetaToken } from "@/lib/pilot-beta-token";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  pilotBetaSignSchema,
  type PilotBetaSignInput,
} from "@/lib/validations/pilot-beta";

export type PilotBetaSignResult =
  | {
      ok: true;
      boxName: string;
      signedAt: Date;
    }
  | {
      ok: false;
      error:
        | "INVALID_TOKEN"
        | "EXPIRED_TOKEN"
        | "BOX_NOT_FOUND"
        | "ALREADY_SIGNED"
        | "VALIDATION"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string>;
    };

/**
 * Firma el contrato piloto-beta. Actualiza Box.pilotBetaSignedAt + audit
 * event. Idempotente: si ya está firmado, retorna ALREADY_SIGNED (no
 * sobreescribe la fecha original — preserva evidence trail).
 */
export async function signPilotBeta(
  input: PilotBetaSignInput,
): Promise<PilotBetaSignResult> {
  // Honeypot — bot trap.
  if (input.website && input.website.length > 0) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "No se pudo procesar la solicitud",
    };
  }

  const parsed = pilotBetaSignSchema.safeParse(input);
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

  // Rate-limit por IP — 5 intentos / 15 min.
  const ip = getClientIp((await headers()) as unknown as Headers);
  const rlIp = rateLimit(`pilot-beta-sign:ip:${ip}`, 5, 15 * 60_000);
  if (!rlIp.ok) {
    return {
      ok: false,
      error: "INTERNAL" as const,
      message: `Demasiados intentos. Vuelve en ${rlIp.retryAfterSec}s.`,
    };
  }

  const tokenResult = await verifyPilotBetaToken(parsed.data.token);
  if (!tokenResult.ok) {
    if (tokenResult.reason === "EXPIRED") {
      return {
        ok: false,
        error: "EXPIRED_TOKEN",
        message:
          "Tu link de firma expiró. Pídeselo a Samuel para que te mande uno nuevo.",
      };
    }
    if (tokenResult.reason === "REVOKED") {
      return {
        ok: false,
        error: "INVALID_TOKEN",
        message:
          "Este link ya no es válido. Contacta a Samuel para solicitar uno nuevo.",
      };
    }
    return {
      ok: false,
      error: "INVALID_TOKEN",
      message: "Token inválido. Verifica que el link esté completo.",
    };
  }

  const { boxId } = tokenResult.payload;

  // Rate-limit por boxId — cierra el caso de attacker rotando IPs contra el mismo box.
  const rlBox = rateLimit(`pilot-beta-sign:box:${boxId}`, 5, 15 * 60_000);
  if (!rlBox.ok) {
    return {
      ok: false,
      error: "INTERNAL" as const,
      message: `Demasiados intentos. Vuelve en ${rlBox.retryAfterSec}s.`,
    };
  }

  const box = await prismaBase.box.findUnique({
    where: { id: boxId },
    select: { name: true, pilotBetaSignedAt: true },
  });
  if (!box) {
    return {
      ok: false,
      error: "BOX_NOT_FOUND",
      message: "No encontramos tu Box. Escríbenos a contacto@kronos-fit.com.",
    };
  }

  if (box.pilotBetaSignedAt) {
    return {
      ok: false,
      error: "ALREADY_SIGNED",
      message: "Este Box ya firmó el contrato piloto.",
    };
  }

  const now = new Date();
  try {
    await prismaBase.box.update({
      where: { id: boxId },
      data: { pilotBetaSignedAt: now },
    });
    await logAudit({
      tenantId: boxId,
      actorId: null,
      action: "PILOT_BETA_SIGNED",
      targetType: "Box",
      targetId: boxId,
      metadata: { signerFullName: parsed.data.fullName },
    });
  } catch (e) {
    console.error("[pilot-beta] update failed:", e);
    return {
      ok: false,
      error: "INTERNAL",
      message: "No pudimos guardar tu firma. Intenta de nuevo en 1 minuto.",
    };
  }

  return {
    ok: true,
    boxName: box.name,
    signedAt: now,
  };
}
