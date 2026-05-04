import { z } from "zod";
import { scoreTypes } from "./wod";

export const scalings = ["RX", "SCALED", "RXPLUS"] as const;
export type Scaling = (typeof scalings)[number];

export const scoreSchema = z.object({
  wodId: z.string().min(1, "WOD requerido"),
  athleteId: z.string().min(1, "Atleta requerido").optional(),
  classId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  value: z.coerce.number().min(0, "Valor inválido"),
  unit: z.string().min(1).max(20),
  scaling: z.enum(scalings).default("RX"),
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type ScoreInput = z.infer<typeof scoreSchema>;

/**
 * Convert mm:ss formatted time into seconds for TIME scores.
 */
export function timeStringToSeconds(input: string): number {
  const parts = input.trim().split(":");
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return Number(input);
}

/**
 * Default unit for a given scoreType — UI hint.
 */
export function defaultUnit(scoreType: (typeof scoreTypes)[number]): string {
  switch (scoreType) {
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
