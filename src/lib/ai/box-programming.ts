import type { WeeklySchedule } from "@/server/actions/box";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EnergySystem =
  | "STRENGTH"
  | "METCON_SHORT"
  | "METCON_LONG"
  | "GYMNASTICS"
  | "MIXED";

export type CycleWodDescriptor = {
  name: string;
  type: "FORTIME" | "AMRAP" | "EMOM" | "TABATA" | "STRENGTH" | "CUSTOM";
  scoreType: "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS";
  energySystem: EnergySystem;
  /** Always non-empty — parser guarantees this. */
  description: string;
  timeCap?: number;
  movements: Array<{
    name: string;
    reps?: number;
    weight?: string;
    notes?: string;
  }>;
};

export type CycleDay = {
  dow: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  focus: string;
  wod: CycleWodDescriptor;
};

export type CycleWeek = {
  weekNumber: number;
  focus: string;
  days: CycleDay[];
  notes?: string;
};

export type CycleDraft = {
  overview: string;
  weeks: CycleWeek[];
  source: "ai" | "fallback";
};

export type BoxProgrammingInputs = {
  boxName: string;
  disciplineName: string;
  startDate: Date;
  endDate: Date;
  /** Clamped to 1–8 by all logic. */
  weeksTotal: number;
  /** Day-of-week numbers where kind==="WOD". 0=Sun, 1=Mon, … 6=Sat. */
  operatingDays: number[];
  focus: "balanced" | "strength" | "conditioning" | "gymnastics" | "competition";
  athleteLevel: "beginner" | "intermediate" | "advanced" | "mixed";
  availableMovements: Array<{ name: string; category: string }>;
  todayDate: Date;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKS_MIN = 1;
const WEEKS_MAX = 8;
const MOVEMENTS_PROMPT_CAP = 40;

/** Rotation for deterministic fallback cycle. */
const ENERGY_SYSTEM_ROTATION: EnergySystem[] = [
  "STRENGTH",
  "METCON_SHORT",
  "GYMNASTICS",
  "METCON_LONG",
  "MIXED",
];

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── buildBoxProgrammingPrompt ────────────────────────────────────────────────

export function buildBoxProgrammingPrompt(inputs: BoxProgrammingInputs): string {
  const weeks = clampWeeks(inputs.weeksTotal);
  const capped = inputs.availableMovements.slice(0, MOVEMENTS_PROMPT_CAP);

  const lines = [
    "You are the Kronos AI programming coach. Generate a multi-week CrossFit-style programming cycle as strict JSON only, without markdown code fences or any text before/after the JSON.",
    "",
    "OUTPUT FORMAT — respond with EXACTLY this structure:",
    "  {",
    '    "overview": "1-2 sentence strategy summary",',
    '    "weeks": [',
    "      {",
    '        "weekNumber": 1,',
    '        "focus": "week theme",',
    '        "notes": "brief coaching note",',
    '        "days": [',
    "          {",
    '            "dow": 1,',
    '            "focus": "day theme",',
    '            "wod": {',
    '              "name": "WOD name",',
    '              "type": "FORTIME|AMRAP|EMOM|TABATA|STRENGTH|CUSTOM",',
    '              "scoreType": "TIME|REPS|WEIGHT|ROUNDS_REPS",',
    '              "energySystem": "STRENGTH|METCON_SHORT|METCON_LONG|GYMNASTICS|MIXED",',
    '              "description": "full WOD description — must not be empty",',
    '              "timeCap": 20,',
    '              "movements": [{ "name": "...", "reps": 10, "weight": "60kg", "notes": "..." }]',
    "            }",
    "          }",
    "        ]",
    "      }",
    "    ]",
    "  }",
    "",
    "RULES:",
    `- Generate exactly ${weeks} weeks.`,
    `- Each week must have exactly these operating days (dow values): [${inputs.operatingDays.join(", ")}]. 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.`,
    "- Every WOD description field must be non-empty — write a real WOD.",
    "- Insert a deload week at week 4, week 8 (lower volume, 50-60%, recovery focus).",
    "- Balance energy systems across the week and cycle.",
    `- Athlete level: ${inputs.athleteLevel}. Adjust volume, complexity, and loading accordingly.`,
    `- Programming focus: ${inputs.focus}. Weight energy system selection toward this focus.`,
    "- Only use movements from the approved list below.",
    "- No markdown. No explanations outside the JSON.",
    "",
    "BOX CONTEXT:",
    JSON.stringify(
      {
        box: inputs.boxName,
        discipline: inputs.disciplineName,
        startDate: inputs.startDate.toISOString().slice(0, 10),
        endDate: inputs.endDate.toISOString().slice(0, 10),
        weeksTotal: weeks,
        operatingDays: inputs.operatingDays,
        focus: inputs.focus,
        athleteLevel: inputs.athleteLevel,
        today: inputs.todayDate.toISOString().slice(0, 10),
      },
      null,
      2,
    ),
    "",
    "APPROVED MOVEMENTS (use only these):",
    JSON.stringify(capped, null, 2),
  ];

  return lines.join("\n");
}

// ─── parseBoxProgramming ──────────────────────────────────────────────────────

export function parseBoxProgramming(raw: string): CycleDraft | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/m, "")
      .replace(/```$/m, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      overview?: unknown;
      weeks?: unknown;
    };

    if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
      return null;
    }

    const weeks: CycleWeek[] = (parsed.weeks as unknown[]).map((w, wi) => {
      const week = w as Record<string, unknown>;
      const days: CycleDay[] = [];

      if (Array.isArray(week.days)) {
        for (const d of week.days as unknown[]) {
          const day = d as Record<string, unknown>;
          const wod = parseWod(day.wod, `week${wi + 1}`);
          days.push({
            dow: typeof day.dow === "number" ? day.dow : 1,
            focus: typeof day.focus === "string" && day.focus ? day.focus : "WOD",
            wod,
          });
        }
      }

      return {
        weekNumber: typeof week.weekNumber === "number" ? week.weekNumber : wi + 1,
        focus: typeof week.focus === "string" && week.focus ? week.focus : "General",
        days,
        notes: typeof week.notes === "string" ? week.notes : undefined,
      };
    });

    return {
      overview:
        typeof parsed.overview === "string" && parsed.overview
          ? parsed.overview
          : "AI-generated programming cycle.",
      weeks,
      source: "ai",
    };
  } catch (err) {
    console.error("[ai.box-programming] parse failed:", err);
    return null;
  }
}

function parseWod(raw: unknown, ctx: string): CycleWodDescriptor {
  const wod = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  const description =
    typeof wod.description === "string" && wod.description.trim()
      ? wod.description.trim()
      : `See coach notes (${ctx})`;

  const validTypes = ["FORTIME", "AMRAP", "EMOM", "TABATA", "STRENGTH", "CUSTOM"];
  const validScoreTypes = ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"];
  const validEnergySystems: EnergySystem[] = [
    "STRENGTH",
    "METCON_SHORT",
    "METCON_LONG",
    "GYMNASTICS",
    "MIXED",
  ];

  return {
    name: typeof wod.name === "string" && wod.name ? wod.name : "WOD",
    type: validTypes.includes(wod.type as string)
      ? (wod.type as CycleWodDescriptor["type"])
      : "CUSTOM",
    scoreType: validScoreTypes.includes(wod.scoreType as string)
      ? (wod.scoreType as CycleWodDescriptor["scoreType"])
      : "REPS",
    energySystem: validEnergySystems.includes(wod.energySystem as EnergySystem)
      ? (wod.energySystem as EnergySystem)
      : "MIXED",
    description,
    timeCap: typeof wod.timeCap === "number" ? wod.timeCap : undefined,
    movements: Array.isArray(wod.movements)
      ? (wod.movements as unknown[]).map((m) => {
          const mv = (
            typeof m === "object" && m !== null ? m : {}
          ) as Record<string, unknown>;
          return {
            name: typeof mv.name === "string" ? mv.name : "Movement",
            reps: typeof mv.reps === "number" ? mv.reps : undefined,
            weight: typeof mv.weight === "string" ? mv.weight : undefined,
            notes: typeof mv.notes === "string" ? mv.notes : undefined,
          };
        })
      : [],
  };
}

// ─── buildFallbackCycle ───────────────────────────────────────────────────────

export function buildFallbackCycle(inputs: BoxProgrammingInputs): CycleDraft {
  const weeks = clampWeeks(inputs.weeksTotal);
  const operatingDays = inputs.operatingDays.slice().sort((a, b) => a - b);

  const cycleWeeks: CycleWeek[] = [];

  let energyIdx = 0;

  for (let w = 1; w <= weeks; w++) {
    const isDeload = w % 4 === 0;
    const weekFocus = isDeload ? "Deload / Recovery" : focusForWeek(w, weeks, inputs.focus);

    const days: CycleDay[] = operatingDays.map((dow) => {
      let energySystem: EnergySystem;
      let description: string;
      let type: CycleWodDescriptor["type"];
      let scoreType: CycleWodDescriptor["scoreType"];

      if (isDeload) {
        energySystem = "MIXED";
        type = "CUSTOM";
        scoreType = "REPS";
        description = buildDeloadDescription(dow);
      } else {
        energySystem = ENERGY_SYSTEM_ROTATION[energyIdx % ENERGY_SYSTEM_ROTATION.length];
        energyIdx++;
        type = typeForEnergySystem(energySystem);
        scoreType = scoreTypeForEnergySystem(energySystem);
        description = buildWodDescription(energySystem, inputs.athleteLevel, dow, w);
      }

      return {
        dow,
        focus: isDeload ? "Active recovery" : labelForEnergySystem(energySystem),
        wod: {
          name: isDeload
            ? `Deload — ${DOW_NAMES[dow]}`
            : `${labelForEnergySystem(energySystem)} — Week ${w} ${DOW_NAMES[dow]}`,
          type,
          scoreType,
          energySystem: isDeload ? "MIXED" : energySystem,
          description,
          movements: [],
        },
      };
    });

    cycleWeeks.push({
      weekNumber: w,
      focus: weekFocus,
      days,
      notes: isDeload
        ? "Deload week: 50-60% volume. Prioritize technique and recovery."
        : undefined,
    });
  }

  return {
    overview: `${weeks}-week ${inputs.focus} programming cycle for ${inputs.boxName}. Deterministic fallback plan — AI unavailable.`,
    weeks: cycleWeeks,
    source: "fallback",
  };
}

function focusForWeek(
  w: number,
  total: number,
  focus: BoxProgrammingInputs["focus"],
): string {
  const third = Math.ceil(total / 3);
  if (w <= third) {
    return focus === "strength"
      ? "Strength Base"
      : focus === "conditioning"
        ? "Aerobic Base"
        : focus === "gymnastics"
          ? "Gymnastics Skill"
          : "General Preparation";
  }
  if (w <= third * 2) {
    return focus === "strength"
      ? "Strength Accumulation"
      : focus === "conditioning"
        ? "Threshold Work"
        : focus === "gymnastics"
          ? "Gymnastics Volume"
          : "Volume + Skill";
  }
  return focus === "competition" ? "Competition Prep" : "Peak / Expression";
}

function labelForEnergySystem(es: EnergySystem): string {
  switch (es) {
    case "STRENGTH":
      return "Strength";
    case "METCON_SHORT":
      return "Short Metcon";
    case "METCON_LONG":
      return "Long Metcon";
    case "GYMNASTICS":
      return "Gymnastics";
    case "MIXED":
      return "Mixed Modal";
  }
}

function typeForEnergySystem(
  es: EnergySystem,
): CycleWodDescriptor["type"] {
  switch (es) {
    case "STRENGTH":
      return "STRENGTH";
    case "METCON_SHORT":
      return "AMRAP";
    case "METCON_LONG":
      return "FORTIME";
    case "GYMNASTICS":
      return "EMOM";
    case "MIXED":
      return "AMRAP";
  }
}

function scoreTypeForEnergySystem(
  es: EnergySystem,
): CycleWodDescriptor["scoreType"] {
  switch (es) {
    case "STRENGTH":
      return "WEIGHT";
    case "METCON_SHORT":
      return "ROUNDS_REPS";
    case "METCON_LONG":
      return "TIME";
    case "GYMNASTICS":
      return "REPS";
    case "MIXED":
      return "ROUNDS_REPS";
  }
}

function buildWodDescription(
  es: EnergySystem,
  level: BoxProgrammingInputs["athleteLevel"],
  dow: number,
  week: number,
): string {
  const dayName = DOW_NAMES[dow];
  const lvl = level === "beginner" ? "light" : level === "advanced" ? "heavy" : "moderate";

  switch (es) {
    case "STRENGTH":
      return `${dayName} Strength — Week ${week}. Build to a ${lvl} 5-rep max on a primary barbell lift. Focus on positioning and tempo.`;
    case "METCON_SHORT":
      return `${dayName} Short Metcon — Week ${week}. 10-12 min AMRAP at ${lvl} intensity. High-output repeating couplet or triplet.`;
    case "METCON_LONG":
      return `${dayName} Long Metcon — Week ${week}. 20-25 min For Time. Sustained aerobic effort at ${lvl} pace. Chippers or team-style.`;
    case "GYMNASTICS":
      return `${dayName} Gymnastics — Week ${week}. Skill EMOM: alternate between two gymnastics movements for 10-16 min. Quality reps only.`;
    case "MIXED":
      return `${dayName} Mixed Modal — Week ${week}. 15 min AMRAP combining barbell, gymnastics, and monostructural elements at ${lvl} load.`;
  }
}

function buildDeloadDescription(dow: number): string {
  const dayName = DOW_NAMES[dow];
  return `${dayName} Deload — Active recovery session. 40-50% of normal volume. Focus on movement quality, mobility, and technique. No maximal effort.`;
}

// ─── expandCycleToClassSlots ──────────────────────────────────────────────────

type ClassSlot = {
  date: Date;
  dow: number;
  weekNumber: number;
  wod: CycleWodDescriptor;
};

const DOW_KEY_MAP: Record<number, keyof WeeklySchedule> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export function expandCycleToClassSlots(
  draft: CycleDraft,
  weeklySchedule: WeeklySchedule,
  startDate: Date,
  timezone: string,
): ClassSlot[] {
  // Normalize startDate to the Monday of the start week using UTC
  // startDate is expected to already be the Monday of week 1.
  const slots: ClassSlot[] = [];

  for (const week of draft.weeks) {
    const weekOffset = (week.weekNumber - 1) * 7; // days from startDate

    for (const day of week.days) {
      const dowKey = DOW_KEY_MAP[day.dow];
      if (!dowKey) continue;

      const dayEntry = weeklySchedule[dowKey];
      if (!dayEntry || dayEntry.kind !== "WOD") continue;

      // Calculate the date for this dow in this week
      // startDate is Monday (dow=1). dow 0=Sun wraps to next Sun.
      const daysFromStart = dowOffset(startDate, day.dow) + weekOffset;
      const baseDate = addDays(startDate, daysFromStart);

      for (const hour of dayEntry.hours) {
        const slotDate = buildLocalDate(baseDate, hour, timezone);
        slots.push({
          date: slotDate,
          dow: day.dow,
          weekNumber: week.weekNumber,
          wod: day.wod,
        });
      }
    }
  }

  // Sort by date ascending
  slots.sort((a, b) => a.date.getTime() - b.date.getTime());

  return slots;
}

/**
 * Returns how many days to add to startDate (a Monday, dow=1) to reach the
 * target dow within the same week. Sunday (0) is treated as 7 days after
 * the previous Sunday, i.e., 6 days ahead of Monday.
 */
function dowOffset(startDate: Date, targetDow: number): number {
  const startDow = startDate.getDay(); // 0=Sun, 1=Mon, ...
  const normalizedStart = startDow === 0 ? 7 : startDow;
  const normalizedTarget = targetDow === 0 ? 7 : targetDow;
  const offset = normalizedTarget - normalizedStart;
  return offset < 0 ? offset + 7 : offset;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Build a Date for a given base date and hour in a given timezone.
 * Uses UTC midnight + hour offset for DST safety when we only care about
 * the correct local wall-clock hour. We represent it as UTC offset using
 * Intl to get the timezone offset.
 */
function buildLocalDate(baseDate: Date, hour: number, timezone: string): Date {
  const y = baseDate.getUTCFullYear();
  const m = baseDate.getUTCMonth();
  const d = baseDate.getUTCDate();

  // Get timezone offset for this exact date+hour combination (handles DST)
  // We create a reference date in UTC noon, then compute the offset
  const refUtc = Date.UTC(y, m, d, 12, 0, 0);
  const tzOffset = getTzOffsetMinutes(refUtc, timezone);

  // Local midnight in UTC: UTC = local - offset
  const localMidnightUtc = Date.UTC(y, m, d, 0, 0, 0) - tzOffset * 60 * 1000;
  return new Date(localMidnightUtc + hour * 60 * 60 * 1000);
}

function getTzOffsetMinutes(utcMs: number, timezone: string): number {
  try {
    // Use Intl to format the time in the given timezone and compute offset
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date(utcMs));
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (offsetPart) {
      const match = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + mins);
      }
    }
  } catch {
    // Fallback to UTC
  }
  return 0;
}

// ─── validateCycleBalance ─────────────────────────────────────────────────────

export function validateCycleBalance(
  draft: CycleDraft,
  focus: BoxProgrammingInputs["focus"],
): { warnings: string[] } {
  const warnings: string[] = [];

  if (draft.weeks.length === 0) return { warnings };

  // 1. Collect all energy systems across all days
  const allSystems = draft.weeks
    .flatMap((w) => w.days.map((d) => d.wod.energySystem))
    .filter(Boolean) as EnergySystem[];

  if (allSystems.length === 0) return { warnings };

  // 2. Check for long runs of the same energy system (>= 4 consecutive)
  let runLength = 1;
  for (let i = 1; i < allSystems.length; i++) {
    if (allSystems[i] === allSystems[i - 1]) {
      runLength++;
      if (runLength >= 4) {
        warnings.push(
          `Long run of ${allSystems[i]} energy system detected (${runLength}+ consecutive days). Consider varying stimulus.`,
        );
        break;
      }
    } else {
      runLength = 1;
    }
  }

  // 3. Check monotony: if 80%+ of days have the same system
  const counts = new Map<EnergySystem, number>();
  for (const s of allSystems) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  for (const [sys, count] of counts) {
    if (count / allSystems.length >= 0.8) {
      warnings.push(
        `Cycle is ${Math.round((count / allSystems.length) * 100)}% ${sys}. Increase variety for long-term adaptation.`,
      );
    }
  }

  // 4. Check for missing deload in 4+ week cycles
  if (draft.weeks.length >= 4) {
    const hasDeload = draft.weeks.some((w) =>
      w.focus.toLowerCase().includes("deload"),
    );
    if (!hasDeload) {
      warnings.push(
        "No deload week found in a 4+ week cycle. Add a deload every 4 weeks to prevent overtraining.",
      );
    }
  }

  // 5. Focus mismatch check
  if (focus === "strength") {
    const strengthCount =
      (counts.get("STRENGTH") ?? 0);
    const metconCount =
      (counts.get("METCON_SHORT") ?? 0) + (counts.get("METCON_LONG") ?? 0);
    if (metconCount > strengthCount * 2) {
      warnings.push(
        `Focus is "strength" but METCON days (${metconCount}) outnumber STRENGTH days (${strengthCount}) 2:1. Review energy system balance for strength focus.`,
      );
    }
  }

  if (focus === "conditioning") {
    const strengthCount = counts.get("STRENGTH") ?? 0;
    const metconCount =
      (counts.get("METCON_SHORT") ?? 0) + (counts.get("METCON_LONG") ?? 0);
    if (strengthCount > metconCount) {
      warnings.push(
        `Focus is "conditioning" but STRENGTH days (${strengthCount}) outnumber METCON days (${metconCount}). Review energy system balance.`,
      );
    }
  }

  return { warnings };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clampWeeks(weeks: number): number {
  return Math.max(WEEKS_MIN, Math.min(WEEKS_MAX, weeks));
}
