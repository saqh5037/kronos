"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase, withTenant } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { logAudit } from "@/server/audit";
import { detectPR, isBetterScore } from "@/lib/scores";

/**
 * Mini editor de WOD para atletas en Box Personal: en una sola pantalla,
 * el atleta ingresa nombre + tipo + scoreType + (opcional) timeCap + su score.
 * Server crea WOD + Score atomic y devuelve wodId.
 *
 * NO soporta movimientos en este MVP — la idea es loggear rápido el "Fran"
 * sin tener que cargar 3 movimientos. La biblioteca con detalle de movimientos
 * + fotos de whiteboard (Slice 5) cubren los casos donde sí se necesita
 * estructura completa.
 */

const wodTypeEnum = z.enum([
  "FORTIME",
  "AMRAP",
  "EMOM",
  "TABATA",
  "STRENGTH",
  "CUSTOM",
]);
const scoreTypeEnum = z.enum(["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"]);
const scalingEnum = z.enum(["RX", "SCALED", "RXPLUS"]);

export const quickWodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  type: wodTypeEnum,
  scoreType: scoreTypeEnum,
  timeCapSeconds: z.number().int().min(0).max(7200).optional().nullable(),
  // Score: lo guarda en la misma operación. value es number en la unidad
  // implicada por scoreType (TIME=segundos, REPS=integer, WEIGHT=kg, ROUNDS_REPS=
  // float donde la parte entera son rounds y los decimales reps. Para simplicidad
  // del MVP recibimos rounds + reps separados y convertimos).
  scoreValue: z.number().min(0).max(99999),
  scoreReps: z.number().int().min(0).max(999).optional().nullable(),
  scaling: scalingEnum.default("RX"),
  notes: z.string().max(500).optional().nullable(),
});

export type QuickWodInput = z.infer<typeof quickWodSchema>;

export type QuickWodPR = {
  isPR: boolean;
  isFirst: boolean;
  previousBest: number | null;
  newValue: number;
  scoreType: QuickWodInput["scoreType"];
  wodName: string;
};

export type QuickWodResult =
  | { ok: true; wodId: string; scoreId: string; pr: QuickWodPR }
  | {
      ok: false;
      error:
        | "UNAUTH"
        | "NOT_PERSONAL"
        | "VALIDATION"
        | "NO_ATHLETE"
        | "SAVE_FAILED";
      message: string;
      fieldErrors?: Record<string, string>;
    };

function unitForScoreType(t: QuickWodInput["scoreType"]): string {
  switch (t) {
    case "TIME":
      return "s";
    case "REPS":
      return "reps";
    case "WEIGHT":
      return "kg";
    case "ROUNDS_REPS":
      return "rounds";
  }
}

export async function createMyQuickWod(
  input: QuickWodInput,
): Promise<QuickWodResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, error: "UNAUTH", message: "Sesión expirada" };
  }

  // Solo Box Personal: el flow es para atletas standalone. Para Box real, el
  // coach crea el WOD y el atleta solo loggea score en /atleta/wod.
  const box = await prismaBase.box.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (!box || !isPersonalBoxSlug(box.slug)) {
    return {
      ok: false,
      error: "NOT_PERSONAL",
      message: "Esta acción es solo para atletas independientes.",
    };
  }

  const parsed = quickWodSchema.safeParse(input);
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

  const data = parsed.data;
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  // Buscar el athlete record del user en este tenant.
  const athlete = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) {
    return {
      ok: false,
      error: "NO_ATHLETE",
      message:
        "No encontramos tu perfil de atleta. Probá completar el onboarding.",
    };
  }

  // Para ROUNDS_REPS, el value canónico es rounds.reps formato decimal
  // (ej: 5 rounds + 12 reps → 5.012). Mantenemos consistencia con cómo
  // el Score se interpreta en /atleta/wod actual.
  let canonicalValue = data.scoreValue;
  if (data.scoreType === "ROUNDS_REPS" && data.scoreReps != null) {
    canonicalValue = data.scoreValue + data.scoreReps / 1000;
  }

  // Toda la escritura va dentro de try/catch: un atleta sin Box (Box Personal,
  // sin programación del coach) no debe poder tumbar la app con un 500 si una
  // query falla. Ante cualquier error de DB devolvemos SAVE_FAILED estructurado
  // — el form muestra un toast y nunca llega al error boundary (que disparaba
  // el React #310 en producción).
  try {
    // PR detection: buscar el mejor score previo del atleta en WODs anteriores
    // con el MISMO name (case-insensitive) + scoreType. Si el nuevo supera al
    // mejor previo, es PR. Si no había scores previos, es "primer score".
    const previousScores = await db.score.findMany({
      where: {
        athleteId: athlete.id,
        wod: {
          name: { equals: data.name, mode: "insensitive" },
          scoreType: data.scoreType,
        },
      },
      select: { value: true },
    });

    const previousBest = previousScores.reduce<number | null>((best, s) => {
      const v = Number(s.value);
      if (best === null) return v;
      return isBetterScore(best, v, data.scoreType) ? v : best;
    }, null);

    const isFirst = previousBest === null;
    // Un primer registro NO es un PR (no hay marca previa que vencer). Solo es
    // PR cuando ya existía un score previo y el nuevo lo supera.
    const isPR =
      !isFirst &&
      detectPR(previousBest, canonicalValue, data.scoreType) !== null;

    const result = await prismaBase.$transaction(async (tx) => {
      const wod = await tx.wOD.create({
        data: {
          tenantId,
          name: data.name,
          type: data.type,
          scoreType: data.scoreType,
          timeCap: data.timeCapSeconds ?? null,
        },
        select: { id: true },
      });
      const score = await tx.score.create({
        data: {
          tenantId,
          wodId: wod.id,
          athleteId: athlete.id,
          value: canonicalValue,
          unit: unitForScoreType(data.scoreType),
          scaling: data.scaling,
          notes: data.notes ?? null,
        },
        select: { id: true },
      });
      return { wodId: wod.id, scoreId: score.id };
    });

    await logAudit({
      tenantId,
      actorId: session.user.id,
      action: "BULK_SCORES_FROM_WHITEBOARD",
      targetType: "WOD",
      targetId: result.wodId,
      metadata: { source: "atleta-quick-wod", scoreId: result.scoreId },
    });

    return {
      ok: true,
      wodId: result.wodId,
      scoreId: result.scoreId,
      pr: {
        isPR,
        isFirst,
        previousBest,
        newValue: canonicalValue,
        scoreType: data.scoreType,
        wodName: data.name,
      },
    };
  } catch (err) {
    console.error("[atleta-quick-wod] save failed:", err);
    return {
      ok: false,
      error: "SAVE_FAILED",
      message: "No pudimos guardar tu WOD. Intenta de nuevo en un momento.",
    };
  }
}
