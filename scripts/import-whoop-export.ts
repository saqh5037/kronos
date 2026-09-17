/**
 * Import a Whoop account-data export (the CSV bundle Whoop emails you) for one
 * athlete, optionally creating that athlete's personal box first.
 *
 * Why this script exists at all: the OAuth sync in `src/lib/wearables/whoop-sync.ts`
 * can only reach back as far as the API window allows and needs a live
 * connection. A 15-month history arrives as a CSV export, which the sync path
 * cannot read.
 *
 * Two things about the export shape drive the design here:
 *
 * 1. It carries NO record ids. `externalId` is therefore synthesised from each
 *    row's natural key — verified collision-free across this export (cycle
 *    start; sleep start+wake; workout start+end+activity), which is what makes
 *    re-running the import idempotent rather than duplicating. The ids are
 *    prefixed `csv:` so they are never confused with the numeric ids the OAuth
 *    sync writes: an export row and an API row for the same night are two
 *    separate identities, because the export never says which API record it came
 *    from. Connecting Whoop by OAuth later will re-import overlapping days under
 *    API ids; de-duplicating that overlap is a deliberate follow-up, not
 *    something this script can guess.
 *
 * 2. Timestamps are LOCAL wall-clock in a separate timezone column
 *    ("UTC-06:00"), not UTC. They are combined before parsing. Reading them as
 *    UTC would shift every record six hours and land workouts on the wrong
 *    civil day — the exact failure already paid for in
 *    `bug.kronos.period_window_host_tz`.
 *
 * What it does NOT do: it does not create `Score` rows. Whoop records strain,
 * heart rate and duration; it does not know which WOD was performed, nor the
 * time, reps or load. Minting Scores from it would fabricate results the athlete
 * never entered, so workouts land in `WhoopWorkout` only.
 *
 * `journal_entries.csv` is skipped by default and is not imported by any flag:
 * it holds intimate self-reported answers (substance use, sexual activity) that
 * have no consumer in the product and no business being in the database.
 *
 * Usage:
 *   pnpm exec tsx scripts/import-whoop-export.ts --dir <csvDir> --email <email>
 *     [--create --first-name Samuel --last-name Quiroz --password <pw>]
 *     [--dry-run]
 *
 * `--password` matters more than it looks: without it the created User has a
 * null passwordHash and no verified email, so the only way in is a magic link
 * or OTP that needs working mail — an account that exists and cannot be used.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient, type Prisma } from "@prisma/client";

import { hashPassword } from "../src/server/auth-password";

import { STANDARD_MOVEMENTS } from "../prisma/data/movements";
import {
  generatePersonalSlug,
  PERSONAL_BOX_NAME,
} from "../src/lib/personal-box";

// ─── CLI ──────────────────────────────────────────────────────────────────────

type Args = {
  dir: string;
  email: string;
  create: boolean;
  firstName: string;
  lastName: string;
  password: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const dir = get("--dir");
  const email = get("--email");
  if (!dir || !email) {
    throw new Error(
      "Usage: --dir <csvDir> --email <email> [--create --first-name X --last-name Y] [--dry-run]",
    );
  }
  return {
    dir,
    email: email.trim().toLowerCase(),
    create: argv.includes("--create"),
    firstName: get("--first-name") ?? "",
    lastName: get("--last-name") ?? "",
    password: get("--password") ?? "",
    dryRun: argv.includes("--dry-run"),
  };
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

/** RFC4180 reader. Kept local so the script needs no dependency. */
function parseCsv(text: string): Record<string, string>[] {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();
  if (!header) return [];
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/**
 * Classify each CSV by the columns it has, not by its filename. Whoop localises
 * the filenames ("sueño.csv"), and a non-UTF-8 zip listing mangles them, so the
 * header signature is the only stable discriminator.
 */
type Kind = "workouts" | "sleep" | "cycles" | "journal";

function classify(columns: string[]): Kind | null {
  const has = (c: string) => columns.includes(c);
  if (has("Texto de la pregunta") || has("Question text")) return "journal";
  if (has("Hora de inicio del entrenamiento") || has("Workout start time")) {
    return "workouts";
  }
  if (has("Siesta") || has("Nap")) return "sleep";
  if (has("Puntuación de recuperación (%)") || has("Recovery score %")) {
    return "cycles";
  }
  return null;
}

function loadExport(dir: string): Record<Kind, Record<string, string>[]> {
  const found: Partial<Record<Kind, Record<string, string>[]>> = {};
  for (const name of readdirSync(dir)) {
    if (!name.toLowerCase().endsWith(".csv")) continue;
    const rows = parseCsv(readFileSync(join(dir, name), "utf8"));
    if (rows.length === 0) continue;
    const kind = classify(Object.keys(rows[0]));
    if (!kind) {
      console.warn(`  ! ${name}: unrecognised column signature, skipped`);
      continue;
    }
    found[kind] = rows;
    console.log(`  · ${name} -> ${kind} (${rows.length} rows)`);
  }
  return {
    workouts: found.workouts ?? [],
    sleep: found.sleep ?? [],
    cycles: found.cycles ?? [],
    journal: found.journal ?? [],
  };
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const TZ_COL = "Zona horaria del ciclo";

/** "UTC-06:00" -> "-06:00"; "UTCZ" -> "Z". */
function offsetSuffix(tz: string): string {
  const t = tz.trim();
  if (t === "UTCZ" || t === "UTC" || t === "Z" || t === "") return "Z";
  const m = /^UTC([+-])(\d{2}):(\d{2})$/.exec(t);
  if (!m) throw new Error(`Unrecognised timezone value: "${tz}"`);
  return `${m[1]}${m[2]}:${m[3]}`;
}

/** Combines the export's wall-clock string with its timezone column. */
function stamp(wall: string, tz: string): Date | null {
  const v = wall.trim();
  if (!v) return null;
  const d = new Date(`${v.replace(" ", "T")}${offsetSuffix(tz)}`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Bad timestamp "${wall}" with timezone "${tz}"`);
  }
  return d;
}

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function int(v: string | undefined): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

/** The export labels energy "cal" but reports kcal; the column stores kJ. */
function kcalToKilojoule(v: string | undefined): number | null {
  const kcal = num(v);
  return kcal === null ? null : Math.round(kcal * 4.184);
}

function minutesToMs(v: string | undefined): number | null {
  const m = num(v);
  return m === null ? null : Math.round(m * 60_000);
}

// ─── Sports ───────────────────────────────────────────────────────────────────

/**
 * Whoop's activity label -> the sport this product shows. `sportId` stays null
 * on purpose: the export omits Whoop's numeric sport id, and inventing one
 * would put a fabricated value in a column the OAuth sync fills from the API.
 * The canonical sport lives in `raw.sport`, with Whoop's own label kept beside
 * it so every mapping stays reversible.
 */
const SPORTS: Record<string, { slug: string; label: string }> = {
  "Entrenamiento funcional": { slug: "crossfit", label: "CrossFit" },
  Actividad: { slug: "activity", label: "Actividad" },
  Béisbol: { slug: "baseball", label: "Béisbol" },
  Correr: { slug: "running", label: "Correr" },
  "Fútbol soccer": { slug: "soccer", label: "Fútbol" },
  "Levantamiento de potencia": { slug: "powerlifting", label: "Powerlifting" },
  "Levantamiento de pesas": { slug: "weightlifting", label: "Halterofilia" },
  Caminar: { slug: "walking", label: "Caminar" },
  Elíptica: { slug: "elliptical", label: "Elíptica" },
  "Tenis de pádel": { slug: "padel", label: "Pádel" },
  HIIT: { slug: "hiit", label: "HIIT" },
  Escaladora: { slug: "stairmaster", label: "Escaladora" },
  Gimnasia: { slug: "gymnastics", label: "Gimnasia" },
  Baile: { slug: "dance", label: "Baile" },
  Kayak: { slug: "kayaking", label: "Kayak" },
  "Hockey sobre césped": { slug: "field-hockey", label: "Hockey sobre césped" },
};

function sportFor(activity: string): {
  slug: string;
  label: string;
  whoopActivity: string;
} {
  const known = SPORTS[activity.trim()];
  if (known) return { ...known, whoopActivity: activity };
  const slug = activity
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  console.warn(`  ! unmapped Whoop activity "${activity}" -> slug "${slug}"`);
  return { slug, label: activity.trim(), whoopActivity: activity };
}

// ─── Provenance ───────────────────────────────────────────────────────────────

function provenance(
  file: Kind,
  row: Record<string, string>,
  extra: Record<string, unknown> = {},
): Prisma.InputJsonValue {
  return {
    source: "whoop-csv-export",
    exportKind: file,
    importedAt: new Date().toISOString(),
    ...extra,
    row,
  } as Prisma.InputJsonValue;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    console.log(`\nReading export from ${args.dir}`);
    const data = loadExport(args.dir);
    if (data.journal.length > 0) {
      console.log(
        `  · journal_entries: ${data.journal.length} rows present, NOT imported (intimate self-reports, no consumer)`,
      );
    }

    // ── Resolve or create the athlete ─────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { email: args.email },
      select: {
        id: true,
        tenantId: true,
        name: true,
        athlete: { select: { id: true } },
      },
    });

    if (!user && !args.create) {
      throw new Error(
        `No user with email ${args.email}. Re-run with --create --first-name X --last-name Y to make one.`,
      );
    }

    if (!user) {
      if (!args.firstName) throw new Error("--create requires --first-name");
      if (args.dryRun) {
        console.log(
          `\n[dry-run] would create personal box + user + athlete for ${args.email}`,
        );
        return;
      }
      // Mirrors the transaction in src/server/actions/atleta-signup.ts. That
      // action cannot be called from a script: it is "use server" and reads
      // next/headers for rate limiting, which throws outside a request.
      const passwordHash = args.password
        ? await hashPassword(args.password)
        : null;
      if (!passwordHash) {
        console.warn(
          "  ! no --password given: the account will have no password, so the only way in is a magic link or OTP",
        );
      }
      const created = await prisma.$transaction(async (tx) => {
        const box = await tx.box.create({
          data: {
            slug: generatePersonalSlug(),
            name: PERSONAL_BOX_NAME,
            subscriptionStatus: "TRIAL",
          },
          select: { id: true, slug: true },
        });
        const u = await tx.user.create({
          data: {
            email: args.email,
            name: args.firstName,
            role: "ATHLETE",
            tenantId: box.id,
            ...(passwordHash
              ? { passwordHash, passwordSetAt: new Date() }
              : {}),
          },
          select: { id: true, tenantId: true },
        });
        const athlete = await tx.athlete.create({
          data: {
            tenantId: box.id,
            userId: u.id,
            firstName: args.firstName,
            lastName: args.lastName,
          },
          select: { id: true },
        });
        await tx.movement.createMany({
          data: STANDARD_MOVEMENTS.map((mv) => ({
            tenantId: box.id,
            name: mv.name,
            slug: mv.slug,
            category: mv.category,
            isStandard: true,
            videoUrl: mv.videoUrl,
            standardDescription: mv.standardDescription,
            equipment: mv.equipment,
          })),
          skipDuplicates: true,
        });
        return { box, userId: u.id, athleteId: athlete.id, tenantId: box.id };
      });
      console.log(
        `\nCreated personal box ${created.box.slug} with athlete ${args.firstName} ${args.lastName} (${STANDARD_MOVEMENTS.length} movements seeded)`,
      );
      user = {
        id: created.userId,
        tenantId: created.tenantId,
        name: args.firstName,
        athlete: { id: created.athleteId },
      };
    }

    if (!user.athlete) {
      throw new Error(
        `User ${args.email} exists but has no Athlete row; cannot attach Whoop data.`,
      );
    }

    const athleteId = user.athlete.id;
    const tenantId = user.tenantId;
    console.log(`\nTarget: athlete ${athleteId} in tenant ${tenantId}`);

    // ── Sleep, keyed by cycle so recoveries can reference it ──────────────────
    type SleepRow = {
      externalId: string;
      cycleStart: string;
      nap: boolean;
      start: Date;
    };
    const sleepByCycle = new Map<string, SleepRow[]>();

    const sleeps = data.sleep.map((row) => {
      const tz = row[TZ_COL] ?? "";
      const start = stamp(row["Inicio del sueño"], tz);
      const end = stamp(row["Inicio de la vigilia"], tz);
      if (!start || !end) return null;
      const externalId = `csv:sleep:${start.toISOString()}_${end.toISOString()}`;
      const nap = (row["Siesta"] ?? "").trim().toLowerCase() === "true";
      const cycleStart = row["Hora de inicio del ciclo"] ?? "";
      const list = sleepByCycle.get(cycleStart) ?? [];
      list.push({ externalId, cycleStart, nap, start });
      sleepByCycle.set(cycleStart, list);
      return {
        where: { externalId },
        data: {
          tenantId,
          athleteId,
          externalId,
          start,
          end,
          nap,
          performance: int(row["Calificación del sueño (%)"]),
          efficiency: num(row["Eficiencia del sueño %"]),
          totalInBedMs: minutesToMs(row["Tiempo en la cama (min)"]),
          totalAsleepMs: minutesToMs(row["Duración del sueño (min)"]),
          // The export has no disturbance count; "Tempo despierto/a" is a
          // duration, not a count, so this stays null rather than guessing.
          disturbances: null,
          raw: provenance("sleep", row, {
            stages: {
              lightMin: num(row["Duración de sueño ligero (min)"]),
              deepMin: num(row["Duración de sueño profundo (SWS) (min)"]),
              remMin: num(row["Duración de sueño REM (min)"]),
              awakeMin: num(row["Tempo despierto/a (min)"]),
            },
            needMin: num(row["Sueño necesario (min)"]),
            debtMin: num(row["Deuda de sueño (min)"]),
            regularityPct: num(row["Regularidad del sueño %"]),
            respiratoryRate: num(row["Frecuencia respiratoria (rpm)"]),
          }),
        },
      };
    });

    // ── Cycles + recoveries ───────────────────────────────────────────────────
    const cycles: {
      where: { externalId: string };
      data: Prisma.WhoopCycleUncheckedCreateInput;
    }[] = [];
    const recoveries: {
      where: { cycleExternalId: string };
      data: Prisma.WhoopRecoveryUncheckedCreateInput;
    }[] = [];

    for (const row of data.cycles) {
      const tz = row[TZ_COL] ?? "";
      const start = stamp(row["Hora de inicio del ciclo"], tz);
      if (!start) continue;
      const externalId = `csv:cycle:${start.toISOString()}`;
      const strain = num(row["Esfuerzo del día"]);

      cycles.push({
        where: { externalId },
        data: {
          tenantId,
          athleteId,
          externalId,
          start,
          end: stamp(row["Hora de finalización del ciclo"], tz),
          strain,
          kilojoule: kcalToKilojoule(row["Energía quemada (cal)"]),
          averageHr: int(row["FC promedio (lpm)"]),
          maxHr: int(row["FC máx. (lpm)"]),
          scoreState: strain === null ? null : "SCORED",
          raw: provenance("cycles", row, { timezone: tz }),
        },
      });

      const score = int(row["Puntuación de recuperación (%)"]);
      if (score === null) continue;

      // Recovery is computed on waking, so the wake stamp is the honest
      // timestamp; fall back to the cycle start when the night is missing.
      const wake = stamp(row["Inicio de la vigilia"], tz);
      const nightSleep = (
        sleepByCycle.get(row["Hora de inicio del ciclo"] ?? "") ?? []
      )
        .filter((s) => !s.nap)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

      recoveries.push({
        where: { cycleExternalId: externalId },
        data: {
          tenantId,
          athleteId,
          cycleExternalId: externalId,
          sleepExternalId: nightSleep?.externalId ?? null,
          recoveredAt: wake ?? start,
          score,
          hrvRmssd: num(row["Variabilidad de la frecuencia cardíaca (ms)"]),
          restingHr: int(row["Frecuencia cardíaca en reposo (lpm)"]),
          spo2: num(row["Oxígeno en sangre %"]),
          skinTempC: num(row["Temp. cutánea (grados centígrados)"]),
          raw: provenance("cycles", row, {
            derivedFrom: "physiological_cycles",
          }),
        },
      });
    }

    // ── Workouts ──────────────────────────────────────────────────────────────
    const workouts = data.workouts.map((row) => {
      const tz = row[TZ_COL] ?? "";
      const start = stamp(row["Hora de inicio del entrenamiento"], tz);
      const end = stamp(row["Hora de finalización del entrenamiento"], tz);
      if (!start || !end) return null;
      const activity = row["Nombre de la actividad"] ?? "";
      const sport = sportFor(activity);
      const externalId = `csv:workout:${start.toISOString()}_${end.toISOString()}_${sport.slug}`;

      const durationMs =
        minutesToMs(row["Duración (min)"]) ?? end.getTime() - start.getTime();
      const pct = [1, 2, 3, 4, 5].map((n) => num(row[`Zona FC ${n}%`]) ?? 0);
      const zoneMs = pct.map((p) => Math.round((durationMs * p) / 100));
      const assigned = zoneMs.reduce((a, b) => a + b, 0);

      return {
        where: { externalId },
        data: {
          tenantId,
          athleteId,
          externalId,
          sportId: null,
          start,
          end,
          strain: num(row["Esfuerzo de actividad"]),
          averageHr: int(row["FC promedio (lpm)"]),
          maxHr: int(row["FC máx. (lpm)"]),
          kilojoule: kcalToKilojoule(row["Energía quemada (cal)"]),
          zoneDurationMs: {
            zone_zero_milli: Math.max(0, durationMs - assigned),
            zone_one_milli: zoneMs[0],
            zone_two_milli: zoneMs[1],
            zone_three_milli: zoneMs[2],
            zone_four_milli: zoneMs[3],
            zone_five_milli: zoneMs[4],
            _derived:
              "zone_* computed from the export's per-zone percentages; zone_zero is the remainder",
          } as Prisma.InputJsonValue,
          raw: provenance("workouts", row, {
            sport,
            durationMs,
            gpsEnabled:
              (row["GPS habilitado"] ?? "").trim().toLowerCase() === "true",
          }),
        },
      };
    });

    // ── Write ─────────────────────────────────────────────────────────────────
    const plan = {
      cycles: cycles.length,
      recoveries: recoveries.length,
      sleeps: sleeps.filter(Boolean).length,
      workouts: workouts.filter(Boolean).length,
    };

    if (args.dryRun) {
      console.log("\n[dry-run] would upsert:", plan);
      const sports = new Map<string, number>();
      for (const w of workouts) {
        if (!w) continue;
        const raw = w.data.raw as { sport: { label: string } };
        sports.set(raw.sport.label, (sports.get(raw.sport.label) ?? 0) + 1);
      }
      console.log("[dry-run] workouts by sport:");
      for (const [label, n] of [...sports].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(n).padStart(4)}  ${label}`);
      }
      return;
    }

    let written = 0;
    const tick = (n: number) => {
      written += n;
      if (written % 200 === 0) console.log(`  ... ${written} rows`);
    };

    console.log("\nUpserting:");
    for (const c of cycles) {
      await prisma.whoopCycle.upsert({
        where: c.where,
        create: c.data,
        update: c.data,
      });
      tick(1);
    }
    console.log(`  cycles: ${cycles.length}`);

    for (const s of sleeps) {
      if (!s) continue;
      await prisma.whoopSleep.upsert({
        where: s.where,
        create: s.data,
        update: s.data,
      });
      tick(1);
    }
    console.log(`  sleeps: ${plan.sleeps}`);

    for (const r of recoveries) {
      await prisma.whoopRecovery.upsert({
        where: r.where,
        create: r.data,
        update: r.data,
      });
      tick(1);
    }
    console.log(`  recoveries: ${recoveries.length}`);

    for (const w of workouts) {
      if (!w) continue;
      await prisma.whoopWorkout.upsert({
        where: w.where,
        create: w.data,
        update: w.data,
      });
      tick(1);
    }
    console.log(`  workouts: ${plan.workouts}`);

    const [cy, sl, re, wo] = await Promise.all([
      prisma.whoopCycle.count({ where: { athleteId } }),
      prisma.whoopSleep.count({ where: { athleteId } }),
      prisma.whoopRecovery.count({ where: { athleteId } }),
      prisma.whoopWorkout.count({ where: { athleteId } }),
    ]);
    console.log(
      `\nDone. In DB for this athlete: ${cy} cycles, ${sl} sleeps, ${re} recoveries, ${wo} workouts.`,
    );
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
