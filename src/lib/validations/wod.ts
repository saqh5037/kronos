import { z } from "zod";

export const wodTypes = [
  "FORTIME",
  "AMRAP",
  "EMOM",
  "TABATA",
  "STRENGTH",
  "CUSTOM",
] as const;
export type WODType = (typeof wodTypes)[number];

export const scoreTypes = ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"] as const;
export type ScoreType = (typeof scoreTypes)[number];

export const wodMovementInputSchema = z.object({
  movementId: z.string().min(1, "Movimiento requerido"),
  reps: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  weight: z.coerce.number().min(0).max(1000).optional().nullable(),
  notes: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  order: z.coerce.number().int().min(0).default(0),
});

export const wodSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  type: z.enum(wodTypes).default("FORTIME"),
  scoreType: z.enum(scoreTypes).default("TIME"),
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  timeCap: z.coerce
    .number()
    .int()
    .min(0)
    .max(180)
    .optional()
    .nullable()
    .transform((v) => (v === 0 ? null : v)),
  movements: z.array(wodMovementInputSchema).default([]),
});

export type WODInput = z.infer<typeof wodSchema>;
export type WODMovementInput = z.infer<typeof wodMovementInputSchema>;
