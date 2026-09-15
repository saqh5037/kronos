/**
 * The seeded movement catalogue is written in Spanish.
 *
 * Audit 2026-09-15 (`/atleta/movimientos/[id]`): the Thruster detail printed
 * equipment "Barbell / Plates", muscles "Quads, Glutes, Shoulders, Core,
 * Triceps" and a description opening "Front squat into overhead press" inside
 * otherwise Spanish copy. None of that was hardcoded in a component — it is
 * exactly what `prisma/data/movements.ts` writes into the DB.
 *
 * `src/app/atleta/movimientos/_lib/movement-i18n.ts` translates those values at
 * read time and STAYS: it is what protects rows seeded months ago, and rows the
 * AI content path generates. This test closes the other half — a FRESH seed
 * must not need the mapper to look Spanish.
 *
 * CrossFit vocabulary Mexican boxes actually speak (WOD, PR, RX, snatch, clean,
 * jerk, thruster, burpee, kipping, hollow, ROM, time cap, erg, box…) is
 * deliberately NOT flagged: translating it would make the copy read as foreign.
 * The banned list below is equipment, anatomy, and the generator's own field
 * labels — the three things the audit actually caught.
 */
import { describe, it, expect } from "vitest";
import {
  MOVEMENT_ENRICHMENTS,
  STANDARD_MOVEMENTS,
} from "../../prisma/data/movements";
import {
  equipmentLabel,
  muscleLabel,
} from "../../src/app/atleta/movimientos/_lib/movement-i18n";

/**
 * Equipment nouns the audit found on screen, plus the rest of the rack.
 *
 * NOT here, on purpose: "Rack", "Kettlebell", "GHD", "Ski erg". Those are what
 * a Mexican box calls them — `EQUIPMENT_ES` in the read-time mapper maps each
 * one to itself, which is the same judgement. "Box" IS translated to "Cajón",
 * because in Kronos a box is the gym.
 */
const BANNED_EQUIPMENT = [
  "Barbell",
  "Plates",
  "Plate",
  "Dumbbell",
  "Bench",
  "Rings",
  "Rope",
  "Rower",
  "Jump rope",
  "Pull-up bar",
  "Parallel bars",
  "Med ball",
  "Wall target",
  "Wall",
  "Harness",
  "Sled",
  "Bike",
];

/** Anatomy. The athlete reads these as a chip list under the video. */
const BANNED_MUSCLES = [
  "quads",
  "quadriceps",
  "glutes",
  "hamstrings",
  "calves",
  "shoulders",
  "delts",
  "rear delts",
  "traps",
  "lats",
  "chest",
  "triceps",
  "biceps",
  "forearms",
  "upper back",
  "lower back",
  "hip flexors",
  "wrist flexors",
  "full body",
  "abs",
  "obliques",
];

/** The generator's own field labels, and English prose it left behind. */
const BANNED_DESCRIPTION_PATTERNS: RegExp[] = [
  /\bScore:/i,
  /\bTips?\s+RX:/i,
  /\bSetup:/i,
  /\bweight \(kg\)/i,
  /\bdistance \(m\)/i,
  /\btime \(s\)/i,
  /\bcalories\b/i,
  /\bascents\b/i,
  /\bFront squat into\b/i,
  /\bchin clearly over\b/i,
  /\bhead touches floor\b/i,
  /\bchest & thighs\b/i,
  /\btouch floor\b/i,
  /\bcrease of hip\b/i,
  /\bover mid-foot\b/i,
  /\btwo-foot takeoff\b/i,
  /\bneutral lower back\b/i,
  /\bshoulder below elbow\b/i,
  /\bhandlebars\b/i,
  /\bmidfoot strike\b/i,
  /\beye level\b/i,
];

describe("seeded movement catalogue is Spanish", () => {
  it("seeds a non-trivial catalogue (guard is actually scanning something)", () => {
    expect(STANDARD_MOVEMENTS.length).toBeGreaterThan(40);
    expect(Object.keys(MOVEMENT_ENRICHMENTS).length).toBeGreaterThan(5);
  });

  it("uses no English equipment nouns", () => {
    const offenders: string[] = [];
    for (const mv of STANDARD_MOVEMENTS) {
      for (const eq of mv.equipment) {
        if (
          BANNED_EQUIPMENT.some((b) => b.toLowerCase() === eq.toLowerCase())
        ) {
          offenders.push(`${mv.slug}: ${eq}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses no English anatomy in musclesWorked", () => {
    const offenders: string[] = [];
    for (const [slug, enrich] of Object.entries(MOVEMENT_ENRICHMENTS)) {
      for (const m of enrich.musclesWorked ?? []) {
        if (BANNED_MUSCLES.some((b) => b.toLowerCase() === m.toLowerCase())) {
          offenders.push(`${slug}: ${m}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("leaves no generator scaffolding or English prose in the descriptions", () => {
    const offenders: string[] = [];
    for (const mv of STANDARD_MOVEMENTS) {
      for (const rx of BANNED_DESCRIPTION_PATTERNS) {
        if (rx.test(mv.standardDescription)) {
          offenders.push(`${mv.slug}: ${rx}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("still describes every movement and names its score unit", () => {
    for (const mv of STANDARD_MOVEMENTS) {
      expect(mv.standardDescription.length, mv.slug).toBeGreaterThan(30);
      // The description must still say HOW the movement is measured; only the
      // label changed, the information did not disappear.
      expect(mv.standardDescription, mv.slug).toMatch(/Se mide en/i);
    }
  });

  it("stays round-trip safe through the read-time mapper", () => {
    // The mapper must be a no-op on already-Spanish rows, otherwise seeding
    // Spanish would double-translate on screen.
    for (const mv of STANDARD_MOVEMENTS) {
      for (const eq of mv.equipment) {
        expect(equipmentLabel(eq), eq).toBe(eq);
      }
    }
    for (const enrich of Object.values(MOVEMENT_ENRICHMENTS)) {
      for (const m of enrich.musclesWorked ?? []) {
        expect(muscleLabel(m), m).toBe(m);
      }
    }
  });
});
