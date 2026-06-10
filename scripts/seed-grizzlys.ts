/**
 * scripts/seed-grizzlys.ts
 *
 * Idempotent provisioning script for "Grizzlys" box.
 * Safe to run multiple times — uses upsert/skip-if-exists throughout.
 * Safe to run against PRODUCTION — only touches slug "grizzlys", no deletes.
 *
 * Usage:
 *   tsx scripts/seed-grizzlys.ts
 *   Env overrides: GRIZZLYS_OWNER_EMAIL (default samuelquirozh@gmail.com),
 *                  GRIZZLYS_ATHLETE_EMAIL (default saqh5037@gmail.com)
 */

import { PrismaClient } from "@prisma/client";
import { seedDefaultMovements } from "../src/server/seed-defaults";

const prisma = new PrismaClient();

const TRIAL_DURATION_DAYS = 14;
const GRIZZLYS_SLUG = "grizzlys";

// ─── Box timezone for class time calculations ─────────────────────────────────
// Times are expressed as local Mexico_City hours; we build UTC DateTimes from
// explicit offsets so the script behaves the same in any host timezone.
// Mexico abolished DST in October 2022 — America/Mexico_City is UTC-6 fixed.
const MEXICO_CITY_UTC_OFFSET_HOURS = -6;

// ─── Class schedule definition ────────────────────────────────────────────────
// Class.startsAt is a DateTime; exact minutes (07:15, 08:30, …) live there.
const WEEKDAY_SLOTS_EXACT: {
  localHour: number;
  localMin: number;
  durationMin: number;
  coach: "gabriel" | "daniel";
}[] = [
  { localHour: 6, localMin: 0, durationMin: 60, coach: "gabriel" },
  { localHour: 7, localMin: 15, durationMin: 60, coach: "gabriel" },
  { localHour: 8, localMin: 30, durationMin: 60, coach: "gabriel" },
  { localHour: 17, localMin: 0, durationMin: 60, coach: "daniel" },
  { localHour: 18, localMin: 0, durationMin: 60, coach: "gabriel" },
  { localHour: 19, localMin: 15, durationMin: 60, coach: "gabriel" },
  { localHour: 20, localMin: 30, durationMin: 60, coach: "gabriel" },
];

const SATURDAY_SLOTS_EXACT: {
  localHour: number;
  localMin: number;
  durationMin: number;
  coach: "gabriel";
}[] = [
  { localHour: 6, localMin: 0, durationMin: 60, coach: "gabriel" },
  { localHour: 7, localMin: 15, durationMin: 60, coach: "gabriel" },
  { localHour: 8, localMin: 30, durationMin: 60, coach: "gabriel" },
];

function mexicoCityToUtcWithMinutes(
  dateStr: string,
  localHour: number,
  localMin: number,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcMs =
    Date.UTC(year, month - 1, day, localHour, localMin, 0, 0) -
    MEXICO_CITY_UTC_OFFSET_HOURS * 3600 * 1000;
  return new Date(utcMs);
}

// ─── WOD definitions ──────────────────────────────────────────────────────────
// The WOD model uses: name, type, description, scoreType, timeCap, scheduledFor
// There are no structured sections/blocks — description is free text.

type WodDef = {
  name: string;
  type: "FORTIME" | "AMRAP" | "EMOM" | "STRENGTH" | "CUSTOM";
  scoreType: "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS";
  description: string;
  timeCap?: number;
  scheduledFor: string; // "YYYY-MM-DD"
};

const GRIZZLYS_WODS: WodDef[] = [
  {
    name: "Monday — Clean & Jerk Intervals",
    type: "CUSTOM",
    scoreType: "TIME",
    scheduledFor: "2026-06-08",
    description: [
      "STRENGTH",
      "Clean — 6 rounds of 2 reps @ 90%",
      "",
      "WOD (20 min cap)",
      "600 m Run",
      "18 Dual DB Hang Clean and Jerk 50/35",
      "400 m Run",
      "18 Dual DB Hang Power Clean and Jerk",
      "200 m Run",
      "18 Hang Power Clean and Jerk",
    ].join("\n"),
    timeCap: 20,
  },
  {
    name: "Tuesday — Snatch Complex + AMRAP",
    type: "AMRAP",
    scoreType: "ROUNDS_REPS",
    scheduledFor: "2026-06-09",
    description: [
      "WARMUP 2x",
      "5 Snatch High Pull",
      "5 Muscle Snatch",
      "5 OHS",
      "30 Single Unders",
      "",
      "STRENGTH",
      "Snatch Complex — 1 Snatch High Pull + 1 Hang Power Snatch + 2 OHS @ 75%",
      "",
      "WOD: AMRAP 3 min x 4 rounds (rest 1 min between rounds)",
      "200 m Run",
      "10 Pull Ups",
      "10 Dips",
      "40 Crossovers",
    ].join("\n"),
    timeCap: 16,
  },
  {
    name: "Wednesday — Back Squat + Intervals",
    type: "CUSTOM",
    scoreType: "REPS",
    scheduledFor: "2026-06-10",
    description: [
      "WARMUP 2x",
      "10 Back Squat",
      "5 Strict Press",
      "5 Box Jump",
      "",
      "STRENGTH",
      "Back Squat — 5 rounds of 3 reps @ 80%",
      "",
      "WOD: Every 3 min x 5 rounds (rest 1 min)",
      "15 Thrusters 95/65",
      "15 Burpees Over the Bar",
      "Max Effort Box Jump Over",
    ].join("\n"),
    timeCap: 20,
  },
  {
    name: "Thursday — Surprise",
    type: "CUSTOM",
    scoreType: "TIME",
    scheduledFor: "2026-06-11",
    description: "Surprise — revealed in class",
  },
  {
    name: "Friday — Man Makers For Time",
    type: "FORTIME",
    scoreType: "TIME",
    scheduledFor: "2026-06-12",
    description: [
      "WARMUP 2x",
      "100 m Run",
      "10 V-Ups",
      "5 DB Thrusters",
      "",
      "WOD For Time (cap 20 min)",
      "10 Man Makers (two dumbbells 50/35)",
      "400 m Run",
      "24 Toes to Bar",
      "8 Man Makers",
      "400 m Run",
      "32 Toes to Bar",
      "6 Man Makers",
      "400 m Run",
      "40 Toes to Bar",
    ].join("\n"),
    timeCap: 20,
  },
  {
    name: "Saturday — EMOM + OHS",
    type: "CUSTOM",
    scoreType: "ROUNDS_REPS",
    scheduledFor: "2026-06-13",
    description: [
      "WARMUP 3x",
      "10 Superman",
      "5 Burpees",
      "10 Pike Push Ups",
      "",
      "WOD 1: EMOM 20 min",
      "Min 1: 10 Dual KB Hang Clean",
      "Min 2: 20 cal Bike / 5 Shuttle Run",
      "Min 3: 10 Burpees Box Jump Over",
      "Min 4: Rest",
      "",
      "WOD 2: 3 rounds, 10 min",
      "10 OHS 135/95",
      "10 Deficit HSPU (45 lb plate each side) / 15 regular HSPU",
    ].join("\n"),
    timeCap: 30,
  },
];

// ─── Week dates (Mon 2026-06-08 – Sat 2026-06-13) ────────────────────────────
// Weekday date strings (Mon–Fri) for class instance generation
const WEEKDAY_DATES: string[] = [
  "2026-06-08", // Mon
  "2026-06-09", // Tue
  "2026-06-10", // Wed
  "2026-06-11", // Thu
  "2026-06-12", // Fri
];
const SATURDAY_DATE = "2026-06-13";

// ─── Recurrence ───────────────────────────────────────────────────────────────
// Kronos materializes recurring classes as concrete rows (see createClass in
// src/server/actions/classes.ts): recurrenceToRRule produces "FREQ=...;COUNT=..."
// (no "RRULE:" prefix, no BYDAY) and expandRecurrence generates one row per
// week. We mirror that: every slot gets RECURRENCE_WEEKS materialized rows.
const RECURRENCE_WEEKS = 12;
const RRULE_WEEKLY = `FREQ=WEEKLY;COUNT=${RECURRENCE_WEEKS}`;

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Starting Grizzlys seed...");

  // ─── Ensure CrossFit discipline exists ─────────────────────────────────────
  const crossfitDiscipline = await prisma.discipline.upsert({
    where: { slug: "crossfit" },
    update: {},
    create: {
      slug: "crossfit",
      name: "CrossFit",
      strategy: "crossfit",
      measurements: ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"],
      leaderboardType: "PR",
      brandColor: "#c8ff2d",
      isActive: true,
    },
  });

  // ─── Box ───────────────────────────────────────────────────────────────────
  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  const box = await prisma.box.upsert({
    where: { slug: GRIZZLYS_SLUG },
    update: {
      // Update mutable config fields on re-run (safe — idempotent values)
      name: "Grizzlys",
      brandColor: "#F26522",
      locale: "es",
      currency: "MXN",
      timezone: "America/Mexico_City",
      defaultClassCapacity: 12,
      disciplineId: crossfitDiscipline.id,
      country: "MX",
    },
    create: {
      slug: GRIZZLYS_SLUG,
      name: "Grizzlys",
      brandColor: "#F26522",
      locale: "es",
      currency: "MXN",
      timezone: "America/Mexico_City",
      defaultClassCapacity: 12,
      subscriptionStatus: "TRIAL",
      trialStartedAt: now,
      trialEndsAt,
      disciplineId: crossfitDiscipline.id,
      country: "MX",
    },
  });

  console.log(`Box: ${box.name} (${box.id})`);

  // ─── Users ─────────────────────────────────────────────────────────────────
  // Email is globally unique and User belongs to exactly ONE tenant. If the
  // email already exists attached to ANOTHER box, silently reusing it would
  // leave the user in the old tenant — abort loudly instead so a human decides.
  async function ensureBoxUser(
    email: string,
    name: string,
    role: "OWNER" | "COACH" | "ATHLETE",
  ) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, tenantId: true, role: true },
    });

    if (existing && existing.tenantId !== box.id) {
      throw new Error(
        `ABORT: user ${email} already exists in another tenant ` +
          `(tenantId=${existing.tenantId}, role=${existing.role}). ` +
          `Refusing to re-point it to Grizzlys — resolve manually.`,
      );
    }

    if (existing) {
      console.log(`User exists, skipping: ${email} (${existing.role})`);
      return existing;
    }

    const created = await prisma.user.create({
      data: { email, name, role, tenantId: box.id },
    });
    console.log(`User created: ${email} (${role})`);
    return created;
  }

  const ownerEmail =
    process.env.GRIZZLYS_OWNER_EMAIL ?? "samuelquirozh@gmail.com";
  const owner = await ensureBoxUser(ownerEmail, "Samuel Quiroz", "OWNER");

  const gabriel = await ensureBoxUser(
    "gabriel.herrera@grizzlys.demo",
    "Gabriel Herrera",
    "COACH",
  );
  const daniel = await ensureBoxUser(
    "daniel.lozano@grizzlys.demo",
    "Daniel Lozano",
    "COACH",
  );
  console.log(
    `Owner: ${owner.id} · Coaches: Gabriel (${gabriel.id}), Daniel (${daniel.id})`,
  );

  // ─── Athlete (Samuel as athlete) ───────────────────────────────────────────
  const athleteEmail =
    process.env.GRIZZLYS_ATHLETE_EMAIL ?? "saqh5037@gmail.com";
  const athleteUser = await ensureBoxUser(
    athleteEmail,
    "Samuel Quiroz",
    "ATHLETE",
  );

  const existingAthlete = await prisma.athlete.findUnique({
    where: { userId: athleteUser.id },
    select: { id: true },
  });
  if (existingAthlete) {
    console.log(`Athlete exists, skipping: ${athleteEmail}`);
  } else {
    await prisma.athlete.create({
      data: {
        tenantId: box.id,
        userId: athleteUser.id,
        firstName: "Samuel",
        lastName: "Quiroz",
        status: "ACTIVE",
      },
    });
    console.log(`Athlete created: ${athleteEmail}`);
  }

  // ─── Standard movement catalog (same as real signup onboarding) ────────────
  await seedDefaultMovements(prisma, box.id);
  console.log("Standard movements seeded (idempotent upsert by slug)");

  const coachMap = { gabriel: gabriel.id, daniel: daniel.id };

  // ─── WODs ──────────────────────────────────────────────────────────────────
  // Upsert by (tenantId, name) — no unique constraint on name, so we check
  // existence first and skip if found (idempotent).
  const wodIdByDate = new Map<string, string>();

  for (const def of GRIZZLYS_WODS) {
    const existing = await prisma.wOD.findFirst({
      where: {
        tenantId: box.id,
        name: def.name,
      },
      select: { id: true },
    });

    if (existing) {
      wodIdByDate.set(def.scheduledFor, existing.id);
      console.log(`WOD exists, skipping: "${def.name}"`);
      continue;
    }

    const scheduledDate = new Date(def.scheduledFor + "T12:00:00Z");

    const wod = await prisma.wOD.create({
      data: {
        tenantId: box.id,
        disciplineId: crossfitDiscipline.id,
        name: def.name,
        type: def.type,
        scoreType: def.scoreType,
        description: def.description,
        timeCap: def.timeCap ?? null,
        scheduledFor: scheduledDate,
      },
    });
    wodIdByDate.set(def.scheduledFor, wod.id);
    console.log(`WOD created: "${wod.name}" (${wod.id})`);
  }

  // ─── Classes ───────────────────────────────────────────────────────────────
  // Strategy: create one Class record per (day × slot) for the current week.
  // Each gets a recurrenceRule so the Programación admin grid recognizes it
  // as a recurring template. Idempotency: check by tenantId + startsAt
  // (DateTime is effectively unique per slot).

  let classesCreated = 0;
  let classesSkipped = 0;

  // Anchor dates (Mon–Sat of the seeded week) with their slot sets
  const SCHEDULE: { dateStr: string; slots: typeof WEEKDAY_SLOTS_EXACT }[] = [
    ...WEEKDAY_DATES.map((dateStr) => ({
      dateStr,
      slots: WEEKDAY_SLOTS_EXACT,
    })),
    { dateStr: SATURDAY_DATE, slots: SATURDAY_SLOTS_EXACT },
  ];

  for (const { dateStr: anchorDate, slots } of SCHEDULE) {
    for (const slot of slots) {
      for (let week = 0; week < RECURRENCE_WEEKS; week++) {
        const dateStr = addDays(anchorDate, week * 7);
        // WODs are only programmed for the anchor week; later weeks get
        // their WOD assigned when the box programs them.
        const dayWodId = week === 0 ? (wodIdByDate.get(dateStr) ?? null) : null;

        const startsAt = mexicoCityToUtcWithMinutes(
          dateStr,
          slot.localHour,
          slot.localMin,
        );

        const existing = await prisma.class.findFirst({
          where: { tenantId: box.id, startsAt },
          select: { id: true },
        });

        if (existing) {
          classesSkipped++;
          continue;
        }

        await prisma.class.create({
          data: {
            tenantId: box.id,
            startsAt,
            durationMin: slot.durationMin,
            capacity: 12,
            kind: "WOD",
            coachId: coachMap[slot.coach],
            wodId: dayWodId,
            recurrenceRule: RRULE_WEEKLY,
            isActive: true,
          },
        });
        classesCreated++;
      }
    }
  }

  console.log(
    `Classes: ${classesCreated} created, ${classesSkipped} already existed (idempotent)`,
  );

  // ─── Final summary ─────────────────────────────────────────────────────────
  const [totalClasses, totalWods, totalUsers, totalMovements] =
    await Promise.all([
      prisma.class.count({ where: { tenantId: box.id } }),
      prisma.wOD.count({ where: { tenantId: box.id } }),
      prisma.user.count({ where: { tenantId: box.id } }),
      prisma.movement.count({ where: { tenantId: box.id } }),
    ]);

  console.log(`
Grizzlys seed complete:
  Box:       ${box.name} slug=${box.slug} id=${box.id}
  Users:     ${totalUsers} (OWNER + 2 COACH + ATHLETE)
  Movements: ${totalMovements} standard
  WODs:      ${totalWods} (Mon 2026-06-08 – Sat 2026-06-13)
  Classes:   ${totalClasses} total
           ${WEEKDAY_DATES.length * WEEKDAY_SLOTS_EXACT.length + SATURDAY_SLOTS_EXACT.length} weekly slots × ${RECURRENCE_WEEKS} weeks materialized
`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
