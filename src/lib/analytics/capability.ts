/**
 * Pure capability classifier.
 *
 * Maps a movement name to one of 5 capability categories using keyword
 * matching (Option A — no schema change). Returns null when the movement
 * does not match any category, so the caller can decide whether to count
 * it or skip it.
 *
 * To upgrade to Option B (schema-backed), replace `inferCapability` with a
 * lookup against `Movement.category`.
 */

export type Capability =
  | "STRENGTH"
  | "OLYMPIC"
  | "CARDIO"
  | "GYMNASTIC"
  | "CORE";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  STRENGTH: "Fuerza",
  OLYMPIC: "Olympic",
  CARDIO: "Cardio",
  GYMNASTIC: "Gimnástico",
  CORE: "Core",
};

// Patterns are anchored at the start of a word but tolerant of plural / -ing
// suffixes that crossfit naming uses ("Burpees", "Running", "Pulling").
const PATTERNS: Array<{ cap: Capability; rx: RegExp }> = [
  // Order matters: more specific (Olympic) before generic (Strength).
  { cap: "OLYMPIC", rx: /\b(snatch|clean|jerk|c&j|ohs|overhead\s*squat)/i },
  {
    cap: "GYMNASTIC",
    rx: /\b(pull[\s-]?up|muscle[\s-]?up|hspu|handstand|ring|bar\s*muscle|rope\s*climb|dip|push[\s-]?up)/i,
  },
  {
    cap: "CORE",
    rx: /\b(t2b|toes[\s-]?to[\s-]?bar|ghd|sit[\s-]?up|plank|hollow|v[\s-]?up|knees[\s-]?to[\s-]?elbow|k2e)/i,
  },
  {
    cap: "CARDIO",
    rx: /\b(run|row|bike|ski|burpee|double[\s-]?under|du|skipping|jump\s*rope|airdyne|assault)/i,
  },
  {
    cap: "STRENGTH",
    rx: /\b(squat|deadlift|press|bench|thruster|lunge|farmer|rdl|good[\s-]?morning)/i,
  },
];

/**
 * Classify a movement by name. Returns null when no pattern matches.
 */
export function inferCapability(movementName: string): Capability | null {
  const name = movementName.trim();
  if (!name) return null;
  for (const p of PATTERNS) {
    if (p.rx.test(name)) return p.cap;
  }
  return null;
}

export type MovementContribution = {
  movementId: string;
  movementName: string;
  /** PR value normalized 0..1 vs the box max for that movement. */
  normalizedScore: number;
};

export type CapabilityBucket = {
  category: Capability;
  label: string;
  /** 0-100 score: average of normalized contributions × 100. */
  score: number;
  /** Sum of raw normalized contributions before division (signal strength). */
  rawValue: number;
  movementCount: number;
};

/**
 * Aggregate per-movement contributions into capability buckets.
 *
 * `boxMaxByMovement` provides the box's best PR per movement, used to
 * normalize each contribution. Movements with no recorded box max
 * contribute 0.
 */
export function buildCapabilityBuckets(input: {
  myPRs: Array<{ movementId: string; movementName: string; value: number }>;
  boxMaxByMovement: Map<string, number>;
}): CapabilityBucket[] {
  const groups = new Map<Capability, MovementContribution[]>();
  for (const cap of Object.keys(CAPABILITY_LABELS) as Capability[]) {
    groups.set(cap, []);
  }

  for (const pr of input.myPRs) {
    const cat = inferCapability(pr.movementName);
    if (!cat) continue;
    const max = input.boxMaxByMovement.get(pr.movementId) ?? pr.value;
    const normalized = max > 0 ? Math.min(1, pr.value / max) : 0;
    groups.get(cat)!.push({
      movementId: pr.movementId,
      movementName: pr.movementName,
      normalizedScore: normalized,
    });
  }

  const buckets: CapabilityBucket[] = [];
  for (const cap of Object.keys(CAPABILITY_LABELS) as Capability[]) {
    const items = groups.get(cap)!;
    const movementCount = items.length;
    const rawValue = items.reduce((s, i) => s + i.normalizedScore, 0);
    const score =
      movementCount === 0
        ? 0
        : Math.round((rawValue / movementCount) * 1000) / 10;
    buckets.push({
      category: cap,
      label: CAPABILITY_LABELS[cap],
      score,
      rawValue: Math.round(rawValue * 1000) / 1000,
      movementCount,
    });
  }
  return buckets;
}

export function pickWeakestStrongest(buckets: CapabilityBucket[]): {
  weakest: string | null;
  strongest: string | null;
} {
  const populated = buckets.filter((b) => b.movementCount > 0);
  if (populated.length === 0) return { weakest: null, strongest: null };
  const sorted = [...populated].sort((a, b) => a.score - b.score);
  return {
    weakest: sorted[0].label,
    strongest: sorted[sorted.length - 1].label,
  };
}
