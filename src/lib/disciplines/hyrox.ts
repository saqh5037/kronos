/**
 * Hyrox DisciplineStrategy.
 *
 * Hyrox es un race format: el atleta corre 8km intercalados con 8 stations
 * funcionales. El único score que importa es el tiempo total (lower = better,
 * típico de race). Opcional: splits por station para análisis.
 *
 * Sin distancias variables ni cargas RX/SCALED como CrossFit — Hyrox tiene
 * divisiones (Open M/F, Pro M/F, Doubles, Relay) que cambian pesos default
 * pero no la lógica de scoring.
 */

import { detectPR, formatScore, isBetterScore } from "../scores";
import type { ScoreType } from "../validations/wod";
import { getHyroxStation } from "./hyrox-stations";
import type {
  DisciplineStrategy,
  ScorePayload,
  ValidationResult,
} from "./types";

export const HYROX_SESSION_TYPES = [
  "HYROX_RACE",
  "HYROX_DOUBLES",
  "HYROX_PRO",
  "HYROX_RELAY",
  "HYROX_TRAINING",
] as const;

export type HyroxSessionType = (typeof HYROX_SESSION_TYPES)[number];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const HyroxStrategy: DisciplineStrategy = {
  slug: "hyrox",
  supportedMeasurements: ["TIME"],
  supportedSessionTypes: HYROX_SESSION_TYPES,
  leaderboardSortKey: "PR",

  validateSessionPayload(payload: unknown): ValidationResult {
    if (!isObject(payload))
      return { ok: false, error: "Payload debe ser objeto" };
    const type = payload.type;
    if (typeof type !== "string") return { ok: false, error: "type requerido" };
    if (!HYROX_SESSION_TYPES.includes(type as HyroxSessionType)) {
      return {
        ok: false,
        error: `type inválido para Hyrox: ${type}. Válidos: ${HYROX_SESSION_TYPES.join(", ")}`,
      };
    }
    // HYROX_TRAINING permite stations parciales; los race types requieren
    // array completo de stations.
    if (type !== "HYROX_TRAINING") {
      const stations = payload.stations;
      if (!Array.isArray(stations) || stations.length === 0) {
        return { ok: false, error: "stations array requerido para race types" };
      }
      for (const stationId of stations) {
        if (typeof stationId !== "string" || !getHyroxStation(stationId)) {
          return {
            ok: false,
            error: `stationId inválido: ${String(stationId)}`,
          };
        }
      }
    }
    return { ok: true };
  },

  validateScorePayload(
    payload: unknown,
    _sessionType: string,
    scoreType: ScoreType,
  ): ValidationResult {
    if (scoreType !== "TIME") {
      return {
        ok: false,
        error: `Hyrox solo soporta scoreType=TIME, recibido: ${scoreType}`,
      };
    }
    if (!isObject(payload))
      return { ok: false, error: "Payload debe ser objeto" };
    const total = payload.totalSeconds;
    if (typeof total !== "number" || total <= 0 || !Number.isFinite(total)) {
      return {
        ok: false,
        error: "totalSeconds debe ser número positivo",
      };
    }
    // Splits opcionales — si vienen, validar que cada key sea station válida.
    const splits = payload.splits;
    if (splits !== undefined) {
      if (!isObject(splits)) {
        return { ok: false, error: "splits debe ser objeto si se incluye" };
      }
      for (const stationId of Object.keys(splits)) {
        if (!getHyroxStation(stationId)) {
          return {
            ok: false,
            error: `splits contiene station inválida: ${stationId}`,
          };
        }
        if (typeof splits[stationId] !== "number" || splits[stationId] <= 0) {
          return {
            ok: false,
            error: `splits.${stationId} debe ser número positivo`,
          };
        }
      }
    }
    return { ok: true };
  },

  formatScore(payload: ScorePayload, scoreType: ScoreType): string {
    if (scoreType !== "TIME") return "—";
    if (payload.totalSeconds == null) return "—";
    return formatScore(payload.totalSeconds, "TIME");
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
