/**
 * CrossFit DisciplineStrategy.
 *
 * Reutiliza los helpers puros existentes en `src/lib/scores.ts` (TIME asc,
 * resto desc; ROUNDS_REPS como decimal packed). No duplica lógica — actúa
 * como adaptador entre el formato Strategy y los helpers legacy.
 */

import { detectPR, formatScore, isBetterScore } from "../scores";
import type { ScoreType } from "../validations/wod";
import type {
  DisciplineStrategy,
  ScorePayload,
  ValidationResult,
} from "./types";

export const CROSSFIT_SESSION_TYPES = [
  "AMRAP",
  "EMOM",
  "FORTIME",
  "TABATA",
  "STRENGTH",
  "CUSTOM",
] as const;

export type CrossfitSessionType = (typeof CROSSFIT_SESSION_TYPES)[number];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const CrossfitStrategy: DisciplineStrategy = {
  slug: "crossfit",
  supportedMeasurements: ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"],
  supportedSessionTypes: CROSSFIT_SESSION_TYPES,
  leaderboardSortKey: "PR",

  validateSessionPayload(payload: unknown): ValidationResult {
    if (!isObject(payload))
      return { ok: false, error: "Payload debe ser objeto" };
    const type = payload.type;
    if (typeof type !== "string") return { ok: false, error: "type requerido" };
    if (!CROSSFIT_SESSION_TYPES.includes(type as CrossfitSessionType)) {
      return {
        ok: false,
        error: `type inválido para CrossFit: ${type}. Válidos: ${CROSSFIT_SESSION_TYPES.join(", ")}`,
      };
    }
    return { ok: true };
  },

  validateScorePayload(
    payload: unknown,
    _sessionType: string,
    scoreType: ScoreType,
  ): ValidationResult {
    if (!isObject(payload))
      return { ok: false, error: "Payload debe ser objeto" };

    switch (scoreType) {
      case "TIME": {
        const v = payload.valueSeconds;
        if (typeof v !== "number" || v <= 0) {
          return { ok: false, error: "valueSeconds debe ser número positivo" };
        }
        return { ok: true };
      }
      case "REPS": {
        const r = payload.reps;
        if (typeof r !== "number" || r < 0 || !Number.isFinite(r)) {
          return { ok: false, error: "reps debe ser número >= 0" };
        }
        return { ok: true };
      }
      case "WEIGHT": {
        const w = payload.weight;
        if (typeof w !== "number" || w <= 0) {
          return { ok: false, error: "weight debe ser número positivo" };
        }
        return { ok: true };
      }
      case "ROUNDS_REPS": {
        const rounds = payload.rounds;
        const partial = payload.partialReps ?? 0;
        if (typeof rounds !== "number" || rounds < 0) {
          return { ok: false, error: "rounds debe ser número >= 0" };
        }
        if (typeof partial !== "number" || partial < 0) {
          return { ok: false, error: "partialReps debe ser número >= 0" };
        }
        return { ok: true };
      }
    }
  },

  formatScore(payload: ScorePayload, scoreType: ScoreType): string {
    switch (scoreType) {
      case "TIME":
        if (payload.valueSeconds == null) return "—";
        return formatScore(payload.valueSeconds, "TIME");
      case "REPS":
        if (payload.reps == null) return "—";
        return formatScore(payload.reps, "REPS");
      case "WEIGHT":
        if (payload.weight == null) return "—";
        return formatScore(payload.weight, "WEIGHT");
      case "ROUNDS_REPS": {
        if (payload.rounds == null) return "—";
        // Helpers legacy esperan decimal packed: rounds + partialReps/100
        const packed = payload.rounds + (payload.partialReps ?? 0) / 100;
        return formatScore(packed, "ROUNDS_REPS");
      }
    }
  },

  detectPR(
    previousPR: number | null,
    candidate: number,
    scoreType: ScoreType,
  ): number | null {
    return detectPR(previousPR, candidate, scoreType);
  },

  isBetterScore(
    previous: number,
    candidate: number,
    scoreType: ScoreType,
  ): boolean {
    return isBetterScore(previous, candidate, scoreType);
  },
};
