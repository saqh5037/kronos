import type { Prisma, PrismaClient, WODType, ScoreType } from "@prisma/client";
import {
  STANDARD_MOVEMENTS,
  MOVEMENT_ENRICHMENTS,
} from "../../prisma/seed-movements";

export { STANDARD_MOVEMENTS, MOVEMENT_ENRICHMENTS };
export const STANDARD_MOVEMENTS_COUNT = STANDARD_MOVEMENTS.length;

// ─── WOD BENCHMARK LIBRARY ───────────────────────────────────────────────────

export type WodRecipe = {
  slug: string;
  name: string;
  type: WODType;
  scoreType: ScoreType;
  description: string;
  timeCap?: number;
  movements: { name: string; reps?: number; weight?: number }[];
};

/**
 * Canonical CrossFit benchmark WODs. The slug is the stable identifier
 * used for selective import (so checkbox state survives renames).
 * The movement.name lookups must match a slug in STANDARD_MOVEMENTS
 * via the tenant-side Movement.name field.
 */
export const WOD_LIBRARY: WodRecipe[] = [
  {
    slug: "fran",
    name: "Fran",
    type: "FORTIME",
    scoreType: "TIME",
    description: "21-15-9 reps for time:\nThruster (43kg/30kg)\nPull-up",
    timeCap: 15,
    movements: [
      { name: "Thruster", reps: 21, weight: 43 },
      { name: "Pull-up", reps: 21 },
    ],
  },
  {
    slug: "helen",
    name: "Helen",
    type: "FORTIME",
    scoreType: "TIME",
    description:
      "3 rounds for time:\n400m run\n21 KB swings (24kg)\n12 pull-ups",
    timeCap: 20,
    movements: [
      { name: "Run", reps: 400 },
      { name: "Kettlebell Swing", reps: 21, weight: 24 },
      { name: "Pull-up", reps: 12 },
    ],
  },
  {
    slug: "cindy",
    name: "Cindy",
    type: "AMRAP",
    scoreType: "ROUNDS_REPS",
    description: "AMRAP 20 min:\n5 pull-ups\n10 push-ups\n15 air squats",
    timeCap: 20,
    movements: [
      { name: "Pull-up", reps: 5 },
      { name: "Push-up", reps: 10 },
      { name: "Air Squat", reps: 15 },
    ],
  },
  {
    slug: "diane",
    name: "Diane",
    type: "FORTIME",
    scoreType: "TIME",
    description: "21-15-9 for time:\nDeadlift (102kg/70kg)\nHandstand push-up",
    timeCap: 15,
    movements: [
      { name: "Deadlift", reps: 21, weight: 102 },
      { name: "Handstand Push-up", reps: 21 },
    ],
  },
  {
    slug: "karen",
    name: "Karen",
    type: "FORTIME",
    scoreType: "TIME",
    description: "150 wall balls (9kg/6kg) for time",
    timeCap: 20,
    movements: [{ name: "Wall Ball", reps: 150, weight: 9 }],
  },
  {
    slug: "murph",
    name: "Murph",
    type: "FORTIME",
    scoreType: "TIME",
    description:
      "1 mile run\n100 pull-ups\n200 push-ups\n300 air squats\n1 mile run",
    timeCap: 60,
    movements: [
      { name: "Run", reps: 1600 },
      { name: "Pull-up", reps: 100 },
      { name: "Push-up", reps: 200 },
      { name: "Air Squat", reps: 300 },
      { name: "Run", reps: 1600 },
    ],
  },
  {
    slug: "annie",
    name: "Annie",
    type: "FORTIME",
    scoreType: "TIME",
    description: "50-40-30-20-10 for time:\nDouble unders\nSit-ups",
    timeCap: 15,
    movements: [
      { name: "Double Under", reps: 50 },
      { name: "Sit-up", reps: 50 },
    ],
  },
  {
    slug: "grace",
    name: "Grace",
    type: "FORTIME",
    scoreType: "TIME",
    description: "30 clean & jerks (60kg/43kg) for time",
    timeCap: 10,
    movements: [{ name: "Clean and Jerk", reps: 30, weight: 60 }],
  },
  {
    slug: "isabel",
    name: "Isabel",
    type: "FORTIME",
    scoreType: "TIME",
    description: "30 snatches (60kg/43kg) for time",
    timeCap: 10,
    movements: [{ name: "Snatch", reps: 30, weight: 60 }],
  },
  {
    slug: "emom-10-power-clean",
    name: "EMOM 10 Power Clean",
    type: "EMOM",
    scoreType: "WEIGHT",
    description: "EMOM 10 min: 3 power cleans @ 70% 1RM",
    movements: [{ name: "Power Clean", reps: 3 }],
  },
  {
    slug: "tabata-squats",
    name: "Tabata Squats",
    type: "TABATA",
    scoreType: "REPS",
    description:
      "Tabata air squats (8 rounds: 20s on / 10s off). Score = total reps",
    movements: [{ name: "Air Squat" }],
  },
  {
    slug: "death-by-burpees",
    name: "Death by Burpees",
    type: "EMOM",
    scoreType: "REPS",
    description: "Min 1: 1 burpee, Min 2: 2 burpees… hasta que falles",
    movements: [{ name: "Burpee" }],
  },
  {
    slug: "1rm-back-squat",
    name: "1RM Back Squat",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Back Squat" }],
  },
  {
    slug: "1rm-front-squat",
    name: "1RM Front Squat",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Front Squat" }],
  },
  {
    slug: "1rm-deadlift",
    name: "1RM Deadlift",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Deadlift" }],
  },
  {
    slug: "1rm-clean",
    name: "1RM Clean",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Clean" }],
  },
  {
    slug: "1rm-snatch",
    name: "1RM Snatch",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Snatch" }],
  },
  {
    slug: "1rm-strict-press",
    name: "1RM Strict Press",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Strict Press" }],
  },
  {
    slug: "1rm-push-press",
    name: "1RM Push Press",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Push Press" }],
  },
  {
    slug: "1rm-thruster",
    name: "1RM Thruster",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Thruster" }],
  },
];

/**
 * Slugs of the 5 most popular benchmarks — pre-selected by default in the
 * onboarding wizard's "Import benchmark WODs" step.
 */
export const DEFAULT_BENCHMARK_SLUGS: readonly string[] = [
  "fran",
  "helen",
  "cindy",
  "murph",
  "annie",
];

type MovementClient = PrismaClient | Prisma.TransactionClient;

/**
 * Seeds the canonical 50 movements for a tenant. Accepts either a full
 * PrismaClient or a transaction client (for atomic signup flows).
 * Idempotent — uses upsert on (tenantId, slug).
 */
export async function seedDefaultMovements(
  client: MovementClient,
  tenantId: string,
): Promise<void> {
  for (const mv of STANDARD_MOVEMENTS) {
    const enrich = MOVEMENT_ENRICHMENTS[mv.slug];
    const enrichmentData: Record<string, unknown> = {};
    let hasContent = false;
    if (enrich) {
      if (enrich.cues) {
        enrichmentData.cues = enrich.cues;
        hasContent = true;
      }
      if (enrich.commonMistakes) {
        enrichmentData.commonMistakes = enrich.commonMistakes;
        hasContent = true;
      }
      if (enrich.progressions) {
        enrichmentData.progressions = enrich.progressions;
        hasContent = true;
      }
      if (enrich.musclesWorked)
        enrichmentData.musclesWorked = enrich.musclesWorked;
      if (enrich.difficulty != null)
        enrichmentData.difficulty = enrich.difficulty;
    }
    if (hasContent) {
      enrichmentData.contentSource = "STANDARD_SEED";
    }
    await client.movement.upsert({
      where: { tenantId_slug: { tenantId, slug: mv.slug } },
      update: {
        name: mv.name,
        category: mv.category,
        standardDescription: mv.standardDescription,
        videoUrl: mv.videoUrl,
        equipment: mv.equipment,
        isStandard: true,
        ...enrichmentData,
      },
      create: {
        tenantId,
        slug: mv.slug,
        name: mv.name,
        category: mv.category,
        isStandard: true,
        standardDescription: mv.standardDescription,
        videoUrl: mv.videoUrl,
        equipment: mv.equipment,
        ...enrichmentData,
      },
    });
  }
}
