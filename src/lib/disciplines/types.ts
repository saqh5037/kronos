/**
 * DisciplineStrategy — contrato que toda disciplina debe implementar.
 *
 * Filosofía: agregar yoga/pilates = nuevo archivo `src/lib/disciplines/{slug}.ts`
 * con una clase que cumple este interface + registro en `registry.ts`.
 * **Cero** edits a componentes core (admin/atleta/leaderboards).
 *
 * Las strategies son **stateless** y **server-safe** (sin acceso a DB).
 * La validación dura vive acá; el schema Prisma solo guarda el `payload Json`.
 */

import type { ScoreType } from "../validations/wod";

export type DisciplineSlug = "crossfit" | "hyrox" | "yoga" | "pilates";

export type ValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Forma del payload de un score. Cada disciplina lee/escribe el subset
 * relevante (ej. CrossFit usa valueSeconds/reps/weight/rounds; Hyrox usa
 * totalSeconds + splits).
 */
export type ScorePayload = {
  valueSeconds?: number;
  reps?: number;
  weight?: number;
  rounds?: number;
  partialReps?: number;
  totalSeconds?: number;
  splits?: Record<string, number>;
};

export interface DisciplineStrategy {
  slug: DisciplineSlug;

  /** ScoreTypes válidos para sesiones de esta disciplina. */
  supportedMeasurements: ReadonlyArray<ScoreType>;

  /**
   * Identificadores de tipos de sesión válidos. Usado por el admin para
   * poblar dropdown del editor (ej. CrossFit: AMRAP/EMOM/FORTIME;
   * Hyrox: HYROX_RACE/HYROX_DOUBLES).
   */
  supportedSessionTypes: ReadonlyArray<string>;

  /** Valida el payload de creación de una sesión. */
  validateSessionPayload(payload: unknown): ValidationResult;

  /** Valida un score contra el tipo de sesión + scoreType esperado. */
  validateScorePayload(
    payload: unknown,
    sessionType: string,
    scoreType: ScoreType,
  ): ValidationResult;

  /** Render display de un score. Devuelve "—" si payload incompleto. */
  formatScore(payload: ScorePayload, scoreType: ScoreType): string;

  /**
   * Detecta PR. Devuelve nuevo valor de PR si candidate supera previousPR
   * (null = sin PR previo, candidate siempre es PR). Devuelve null si NO
   * es PR.
   */
  detectPR(
    previousPR: number | null,
    candidate: number,
    scoreType: ScoreType,
  ): number | null;

  /** Comparador puro: candidate strictly better than previous. */
  isBetterScore(
    previous: number,
    candidate: number,
    scoreType: ScoreType,
  ): boolean;

  /**
   * Cómo ordena el leaderboard de esta disciplina:
   * - "PR": ranking por mejor PR registrado (CrossFit, Hyrox)
   * - "STREAK": ranking por racha consecutiva (Yoga, meditación)
   * - "CONSISTENCY": ranking por % de sesiones completadas (Pilates)
   */
  leaderboardSortKey: "PR" | "STREAK" | "CONSISTENCY";
}
