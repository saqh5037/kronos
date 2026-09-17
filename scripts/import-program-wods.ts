/**
 * Import a week of programming into one athlete's personal program.
 *
 * Kronos has two ways a WOD reaches an athlete: a box schedules a `Class` that
 * references it, or the athlete owns it in their personal program
 * (`WOD.ownerAthleteId` + `WOD.scheduledFor`). An independent athlete in a
 * personal box has no classes, so the personal-program path is the only one
 * that puts a WOD on their day.
 *
 * The programming itself stays OUT of this repository: it is one box's
 * whiteboard, not product data. Pass it as JSON.
 *
 *   {
 *     "weekStart": "2026-09-14",          // the Monday the days are relative to
 *     "wods": [{
 *       "day": "MON",                      // MON..SUN
 *       "name": "Snatch pull con codos altos",
 *       "type": "STRENGTH",                // WODType
 *       "scoreType": "WEIGHT",             // ScoreType
 *       "timeCapSeconds": 900,             // optional
 *       "description": "...",
 *       "movements": [{ "slug": "snatch", "reps": 3, "weight": 60, "notes": "...", "order": 0 }]
 *     }]
 *   }
 *
 * A note on movement links, because it decides whether PRs ever fire: the PR
 * path in `src/server/actions/scores.ts` only triggers for a WOD that is
 * STRENGTH + WEIGHT with EXACTLY ONE linked movement. So a single-lift day gets
 * exactly one movement and warmup work stays in the description; a complex
 * (clean + press) links both and deliberately earns no automatic PR, because a
 * complex is not a one-movement record.
 *
 * Re-running is idempotent: a WOD is matched on
 * (tenantId, ownerAthleteId, name, scheduledFor).
 *
 * Usage:
 *   pnpm exec tsx scripts/import-program-wods.ts --file <json> --email <email> [--dry-run]
 */

import { readFileSync } from "node:fs";

import {
  PrismaClient,
  type Prisma,
  type ScoreType,
  type WODType,
} from "@prisma/client";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
type Day = (typeof DAYS)[number];

type MovementSpec = {
  slug: string;
  reps?: number;
  weight?: number;
  notes?: string;
  order?: number;
};

type WodSpec = {
  day: Day;
  name: string;
  type: WODType;
  scoreType: ScoreType;
  timeCapSeconds?: number | null;
  description?: string;
  movements?: MovementSpec[];
};

type ProgramFile = {
  weekStart: string;
  source?: string;
  wods: WodSpec[];
};

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * `WOD.scheduledFor` is `@db.Date` — a civil date with no time. It is built at
 * UTC midnight so the stored day never shifts with the host's timezone, the
 * failure already paid for in `bug.kronos.period_window_host_tz`.
 */
function dateForDay(weekStart: string, day: Day): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    throw new Error(`weekStart must be YYYY-MM-DD, got "${weekStart}"`);
  }
  const monday = new Date(`${weekStart}T00:00:00Z`);
  if (monday.getUTCDay() !== 1) {
    throw new Error(
      `weekStart ${weekStart} is not a Monday (UTC day ${monday.getUTCDay()})`,
    );
  }
  const offset = DAYS.indexOf(day);
  if (offset === -1)
    throw new Error(`Unknown day "${day}"; expected one of ${DAYS.join(", ")}`);
  return new Date(monday.getTime() + offset * 86_400_000);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const file = arg("--file");
  const email = arg("--email")?.trim().toLowerCase();
  const dryRun = process.argv.includes("--dry-run");
  if (!file || !email) {
    throw new Error("Usage: --file <json> --email <email> [--dry-run]");
  }

  const program = JSON.parse(readFileSync(file, "utf8")) as ProgramFile;
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { tenantId: true, athlete: { select: { id: true } } },
    });
    if (!user?.athlete) throw new Error(`No athlete for email ${email}`);
    const { tenantId } = user;
    const athleteId = user.athlete.id;

    const movements = await prisma.movement.findMany({
      where: { tenantId },
      select: { id: true, slug: true },
    });
    const bySlug = new Map(movements.map((m) => [m.slug, m.id]));

    console.log(
      `\nProgram: ${program.wods.length} WODs, week of ${program.weekStart}`,
    );
    if (program.source) console.log(`Source: ${program.source}`);
    console.log(`Target: athlete ${athleteId} in tenant ${tenantId}\n`);

    // Fail before writing anything if the programming names a movement this box
    // does not have — a half-linked week is worse than a refused import.
    const missing = new Set<string>();
    for (const wod of program.wods) {
      for (const mv of wod.movements ?? []) {
        if (!bySlug.has(mv.slug)) missing.add(mv.slug);
      }
    }
    if (missing.size > 0) {
      throw new Error(
        `Movements not found in this box: ${[...missing].join(", ")}. Seed them first or fix the slugs.`,
      );
    }

    for (const wod of program.wods) {
      const scheduledFor = dateForDay(program.weekStart, wod.day);
      const specs = (wod.movements ?? []).map((mv, i) => ({
        ...mv,
        order: mv.order ?? i,
      }));

      const label = `${wod.day} ${dayKey(scheduledFor)}  ${wod.name}`;
      if (dryRun) {
        console.log(
          `[dry-run] ${label}  [${wod.type}/${wod.scoreType}]  ${specs.length} movement(s): ${specs.map((s) => s.slug).join(", ")}`,
        );
        continue;
      }

      const existing = await prisma.wOD.findFirst({
        where: {
          tenantId,
          ownerAthleteId: athleteId,
          name: wod.name,
          scheduledFor,
        },
        select: { id: true },
      });

      const data = {
        tenantId,
        ownerAthleteId: athleteId,
        name: wod.name,
        type: wod.type,
        scoreType: wod.scoreType,
        description: wod.description ?? null,
        timeCap: wod.timeCapSeconds ?? null,
        scheduledFor,
        isActive: true,
      };

      const saved = existing
        ? await prisma.wOD.update({
            where: { id: existing.id },
            data,
            select: { id: true },
          })
        : await prisma.wOD.create({ data, select: { id: true } });

      // Replace the links rather than merge, so a corrected whiteboard does not
      // leave a stale movement attached to the WOD.
      await prisma.wODMovement.deleteMany({ where: { wodId: saved.id } });
      if (specs.length > 0) {
        await prisma.wODMovement.createMany({
          data: specs.map((mv) => ({
            wodId: saved.id,
            movementId: bySlug.get(mv.slug) as string,
            reps: mv.reps ?? null,
            weight:
              mv.weight === undefined
                ? null
                : (mv.weight as unknown as Prisma.Decimal),
            notes: mv.notes ?? null,
            order: mv.order as number,
          })),
          skipDuplicates: true,
        });
      }

      const prCapable =
        wod.type === "STRENGTH" &&
        wod.scoreType === "WEIGHT" &&
        specs.length === 1;
      console.log(
        `${existing ? "updated" : "created"}  ${label}  [${wod.type}/${wod.scoreType}]  ${specs.length} movement(s)${prCapable ? "  · PR-capable" : ""}`,
      );
    }

    if (!dryRun) {
      const total = await prisma.wOD.count({
        where: { tenantId, ownerAthleteId: athleteId },
      });
      console.log(`\nDone. ${total} WODs in this athlete's personal program.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(
    `\nImport failed: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
});
