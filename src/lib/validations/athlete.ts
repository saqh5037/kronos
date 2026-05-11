import { z } from "zod";

export const athleteSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  phone: z.string().optional(),
  dob: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  healthHistory: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "PAUSED", "DROPIN", "CANCELLED"]).default("ACTIVE"),
});

export type AthleteInput = z.infer<typeof athleteSchema>;

/**
 * Fitness goal tags — stored inside `Athlete.tags[]` with the `goal:` prefix
 * to coexist with existing tags (e.g. `level:rx`). Multi-select allowed.
 */
export const FITNESS_GOAL_TAGS = [
  "competitive",
  "wellness",
  "weight_loss",
  "muscle_gain",
  "recovery",
] as const;

export type FitnessGoalTag = (typeof FITNESS_GOAL_TAGS)[number];

export const FITNESS_GOAL_LABEL: Record<FitnessGoalTag, string> = {
  competitive: "Competir",
  wellness: "Estar bien / salud",
  weight_loss: "Perder grasa",
  muscle_gain: "Ganar músculo",
  recovery: "Movimiento / recuperación",
};

const PREFIX = "goal:";

export function readFitnessGoalTags(tags: string[]): FitnessGoalTag[] {
  const allowed = new Set<string>(FITNESS_GOAL_TAGS);
  return tags
    .filter((t) => t.startsWith(PREFIX))
    .map((t) => t.slice(PREFIX.length))
    .filter((t): t is FitnessGoalTag => allowed.has(t));
}

export function withFitnessGoalTags(
  existingTags: string[],
  goals: FitnessGoalTag[],
): string[] {
  const stripped = existingTags.filter((t) => !t.startsWith(PREFIX));
  const dedup = Array.from(new Set(goals));
  return [...stripped, ...dedup.map((g) => `${PREFIX}${g}`)];
}

export function isWellnessAudience(tags: string[]): boolean {
  const goals = readFitnessGoalTags(tags);
  if (goals.length === 0) return false;
  if (goals.includes("competitive")) return false;
  return goals.some(
    (g) => g === "wellness" || g === "weight_loss" || g === "muscle_gain",
  );
}
