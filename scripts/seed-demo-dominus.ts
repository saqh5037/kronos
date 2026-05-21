/**
 * Demo Box "Dominus" seed.
 *
 * Genera un box demo con 3 meses de actividad histórica retroactiva
 * para presentaciones de ventas y validación de reportería/proyecciones.
 *
 * SAFETY: opera SOLO sobre el slug `dominus`. Ningún otro tenant es tocado.
 *
 * Modes:
 *   pnpm tsx scripts/seed-demo-dominus.ts             → idempotente: skip si existe
 *   pnpm tsx scripts/seed-demo-dominus.ts --reset     → borra y recrea
 *   pnpm tsx scripts/seed-demo-dominus.ts --dry-run   → preview, no escribe
 *
 * Datos generados:
 *   - 1 Box (Dominus CrossFit), subscriptionStatus=ACTIVE
 *   - 1 Owner + 3 Coaches (Users con passwordHash)
 *   - ~95 movimientos estándar (vía seedStandardMovements)
 *   - 8 WODs benchmark (Fran, Helen, Cindy, Murph, Grace, Annie, Diane, Karen)
 *   - 1 MembershipPlan (Mensual Ilimitado)
 *   - 30 atletas distribuidos en 3 meses (20 → +5 → +5)
 *   - ~310 clases (4/día × 6 días/sem × 13 semanas pasadas + 14 días futuros)
 *   - ~600 bookings con asistencias, no-shows, cancelaciones realistas
 *   - ~450 scores con bell curve por WOD + scaling distribuido
 *   - ~40 PRs en movimientos benchmark distribuidos
 *
 * Login del demo (después del seed):
 *   Owner:    owner@demo.kronos-fit.com     / DemoBox2026!
 *   Coach:    coach.alex@demo.kronos-fit.com / DemoBox2026!
 *   Atleta:   sandra.test@demo.kronos-fit.com / DemoBox2026!
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedStandardMovements } from "../prisma/seed-movements";
import { WOD_LIBRARY } from "../src/server/seed-defaults";

const prisma = new PrismaClient();

// ─── Constants ──────────────────────────────────────────────────────────────

const SAFE_SLUG = "dominus-demo";
const DEMO_EMAIL_DOMAIN = "demo.kronos-fit.com";
const DEMO_PASSWORD = "DemoBox2026!";
const BCRYPT_ROUNDS = 10;

const TODAY = new Date();
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_OF_HISTORY = 90;
const DAYS_OF_FUTURE = 14;

// Class schedule: 4 horarios/día, lun-sab
const CLASS_HOURS = [6, 12, 17, 18];
const ACTIVE_WEEKDAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat (0=Sun)

// Athlete waves
const WAVE_1_COUNT = 20; // hace ~90 días
const WAVE_2_COUNT = 5; // hace ~60 días
const WAVE_3_COUNT = 5; // hace ~30 días

// ─── Pseudo-random (deterministic for reproducibility) ─────────────────────

let seed = 0xd0_71_19_05; // "Dominus"

function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function chance(p: number): boolean {
  return rand() < p;
}

// Bell-curve approximation around mean with stddev fraction
function bellAround(mean: number, stddevFrac: number): number {
  const u = 1 - rand();
  const v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean * (1 + z * stddevFrac);
}

// ─── Name pools ─────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Sandra",
  "Carlos",
  "Mariana",
  "Diego",
  "Valeria",
  "Andrés",
  "Sofía",
  "Miguel",
  "Camila",
  "Mateo",
  "Renata",
  "Sebastián",
  "Isabella",
  "Lucas",
  "Emma",
  "Joaquín",
  "Lucía",
  "Daniel",
  "Mía",
  "Alejandro",
  "Romina",
  "Tomás",
  "Catalina",
  "Nicolás",
  "Antonella",
  "Emiliano",
  "Julieta",
  "Maximiliano",
  "Constanza",
  "Iván",
  "Florencia",
  "Bruno",
  "Agustina",
  "Felipe",
  "Martina",
  "Esteban",
  "Carla",
  "Gonzalo",
  "Bárbara",
  "Rodrigo",
  "Daniela",
  "Pablo",
  "Gabriela",
  "Hugo",
  "Ximena",
  "Leonardo",
];

const LAST_NAMES_BASE = [
  "Vega",
  "Martínez",
  "Torres",
  "Reyes",
  "Luna",
  "García",
  "López",
  "Hernández",
  "Pérez",
  "Rodríguez",
  "Sánchez",
  "Ramírez",
  "Cruz",
  "Flores",
  "Gómez",
  "Díaz",
  "Castro",
  "Ortiz",
  "Romero",
  "Mendoza",
  "Aguilar",
  "Vargas",
  "Herrera",
  "Jiménez",
  "Moreno",
  "Rojas",
  "Núñez",
  "Silva",
  "Soto",
  "Chávez",
];

// All athletes carry "Test" as second surname to mark them as demo data.
const DEMO_SECOND_SURNAME = "Test";

// ─── Args parsing ───────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");
const DRY_RUN = args.has("--dry-run");

// ─── Logging ────────────────────────────────────────────────────────────────

function log(stage: string, msg: string): void {
  console.log(`[${stage}] ${msg}`);
}

function bar(): void {
  console.log("─".repeat(72));
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  bar();
  log(
    "init",
    `Demo seed for slug='${SAFE_SLUG}'  reset=${RESET}  dry-run=${DRY_RUN}`,
  );
  log(
    "init",
    `DB URL: ${process.env.DATABASE_URL?.split("@")[1] ?? "<unset>"}`,
  );
  bar();

  if (DRY_RUN) {
    log(
      "dry-run",
      "Preview mode. NO escritura. Mostrando lo que se crearía con --reset.",
    );
    previewSummary();
    return;
  }

  // ─── Discipline (crossfit) — global, debería existir ya ──────────────────
  const discipline = await prisma.discipline.upsert({
    where: { slug: "crossfit" },
    update: {},
    create: {
      slug: "crossfit",
      name: "CrossFit",
      strategy: "crossfit",
      brandColor: "#c8ff2d",
      measurements: ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"],
      leaderboardType: "PR",
    },
  });
  log("discipline", `OK ${discipline.slug} (${discipline.id})`);

  // ─── Box: detectar si existe ──────────────────────────────────────────────
  const existingBox = await prisma.box.findUnique({
    where: { slug: SAFE_SLUG },
  });

  if (existingBox && !RESET) {
    log(
      "box",
      `Box '${SAFE_SLUG}' ya existe (${existingBox.id}). Use --reset para recrear. Abortando.`,
    );
    await prisma.$disconnect();
    return;
  }

  if (existingBox && RESET) {
    log(
      "reset",
      `Borrando todo el contenido del Box '${SAFE_SLUG}' (${existingBox.id})...`,
    );
    await deleteBoxCascade(existingBox.id);
    log("reset", "Borrado completo.");
  }

  // ─── Box: create ──────────────────────────────────────────────────────────
  const box = await prisma.box.create({
    data: {
      slug: SAFE_SLUG,
      name: "Dominus CrossFit Demo",
      locale: "es-MX",
      currency: "MXN",
      timezone: "America/Mexico_City",
      defaultClassCapacity: 12,
      bookingOpenHoursAhead: 24,
      cancelCloseMinBefore: 30,
      brandColor: "#c8ff2d",
      subscriptionStatus: "ACTIVE",
      trialStartedAt: daysAgo(120),
      trialEndsAt: daysAgo(90),
      onboardingCompletedAt: daysAgo(88),
      disciplineId: discipline.id,
      country: "MX",
      city: "Ciudad de México",
      region: "CDMX",
      createdAt: daysAgo(120),
    },
  });
  log("box", `Creado: ${box.name} (${box.id})`);

  // ─── Owner + Coaches ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  const owner = await prisma.user.create({
    data: {
      email: `owner@${DEMO_EMAIL_DOMAIN}`,
      name: "Sofía Domínguez",
      role: "OWNER",
      tenantId: box.id,
      passwordHash,
      passwordSetAt: daysAgo(120),
      emailVerified: daysAgo(120),
    },
  });
  log("owner", `${owner.email}`);

  const coachData = [
    { firstName: "Alex", lastName: "Mendoza" },
    { firstName: "Camila", lastName: "Reyes" },
    { firstName: "Diego", lastName: "Ortiz" },
  ];
  const coaches = await Promise.all(
    coachData.map((c, i) =>
      prisma.user.create({
        data: {
          email: `coach.${c.firstName.toLowerCase()}@${DEMO_EMAIL_DOMAIN}`,
          name: `${c.firstName} ${c.lastName}`,
          role: "COACH",
          tenantId: box.id,
          passwordHash,
          passwordSetAt: daysAgo(118 - i),
          emailVerified: daysAgo(118 - i),
        },
      }),
    ),
  );
  log("coaches", `${coaches.length} creados`);

  // ─── Movements (standard library) ────────────────────────────────────────
  await seedStandardMovements(box.id);
  const movementsCount = await prisma.movement.count({
    where: { tenantId: box.id },
  });
  log("movements", `${movementsCount} movimientos estándar`);

  // ─── WODs benchmark ──────────────────────────────────────────────────────
  const wods: { id: string; name: string; scoreType: string }[] = [];
  for (const recipe of WOD_LIBRARY) {
    const wod = await prisma.wOD.create({
      data: {
        tenantId: box.id,
        name: recipe.name,
        type: recipe.type as never,
        description: recipe.description ?? null,
        scoreType: recipe.scoreType as never,
        timeCap: recipe.timeCap ?? null,
        disciplineId: discipline.id,
        createdAt: daysAgo(110 - wods.length * 2),
      },
    });

    // Link movements via WODMovement pivot (dedupe pairs — some WODs like
    // Murph repeat the same movement at different positions)
    const seenMovementIds = new Set<string>();
    for (let i = 0; i < recipe.movements.length; i++) {
      const m = recipe.movements[i]!;
      const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const movement = await prisma.movement.findUnique({
        where: { tenantId_slug: { tenantId: box.id, slug } },
      });
      if (!movement) continue;
      if (seenMovementIds.has(movement.id)) continue;
      seenMovementIds.add(movement.id);
      await prisma.wODMovement.create({
        data: {
          wodId: wod.id,
          movementId: movement.id,
          reps: m.reps ?? null,
          weight: m.weight ? String(m.weight) : null,
          order: i,
        },
      });
    }
    wods.push({ id: wod.id, name: wod.name, scoreType: wod.scoreType });
  }
  log("wods", `${wods.length} WODs (${wods.map((w) => w.name).join(", ")})`);

  // ─── Membership plan ──────────────────────────────────────────────────────
  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId: box.id,
      name: "Ilimitado Mensual",
      type: "UNLIMITED",
      price: "1500",
      currency: "MXN",
      classesPerMonth: null,
      durationDays: 30,
      isActive: true,
      createdAt: daysAgo(115),
    },
  });
  log("plan", `${plan.name} $${plan.price} ${plan.currency}`);

  // ─── Athletes en 3 oleadas ───────────────────────────────────────────────
  const waves = [
    { count: WAVE_1_COUNT, joinedDaysAgo: 88, label: "wave-1 (mes -3)" },
    { count: WAVE_2_COUNT, joinedDaysAgo: 58, label: "wave-2 (mes -2)" },
    { count: WAVE_3_COUNT, joinedDaysAgo: 28, label: "wave-3 (mes -1)" },
  ];

  const athletes: {
    id: string;
    userId: string;
    name: string;
    joinedAt: Date;
  }[] = [];
  const usedNames = new Set<string>();

  for (const wave of waves) {
    for (let i = 0; i < wave.count; i++) {
      let firstName = "";
      let lastName = "";
      let nameKey = "";
      // ensure unique first+last
      for (let attempt = 0; attempt < 50; attempt++) {
        firstName = pick(FIRST_NAMES);
        lastName = pick(LAST_NAMES_BASE);
        nameKey = `${firstName}|${lastName}`;
        if (!usedNames.has(nameKey)) break;
      }
      usedNames.add(nameKey);

      const joinedDaysOffset = randInt(-3, 3);
      const joinedAt = daysAgo(wave.joinedDaysAgo - joinedDaysOffset);
      const emailSlug = `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}.${athletes.length + 1}`;
      const email = `${emailSlug}@${DEMO_EMAIL_DOMAIN}`;

      const user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName} ${DEMO_SECOND_SURNAME}`,
          role: "ATHLETE",
          tenantId: box.id,
          passwordHash,
          passwordSetAt: joinedAt,
          emailVerified: joinedAt,
        },
      });

      const ageYears = randInt(22, 48);
      const sex = chance(0.55) ? "MALE" : "FEMALE";
      const dob = new Date(
        TODAY.getFullYear() - ageYears,
        randInt(0, 11),
        randInt(1, 28),
      );

      const athlete = await prisma.athlete.create({
        data: {
          tenantId: box.id,
          userId: user.id,
          firstName,
          lastName: `${lastName} ${DEMO_SECOND_SURNAME}`,
          dob,
          phone: `+52 55 ${randInt(1000, 9999)} ${randInt(1000, 9999)}`,
          status: "ACTIVE",
          tags: [],
          primaryDisciplineId: discipline.id,
          biologicalSex: sex as never,
          weightKg: sex === "MALE" ? bellAround(78, 0.1) : bellAround(62, 0.1),
          heightCm:
            sex === "MALE" ? bellAround(175, 0.04) : bellAround(162, 0.04),
          ageYears,
          fitnessExperience: pick([
            "BEGINNER",
            "INTERMEDIATE",
            "INTERMEDIATE",
            "ADVANCED",
          ]) as never,
          fitnessGoal: pick([
            "LOSE_WEIGHT",
            "BUILD_MUSCLE",
            "PERFORMANCE",
            "GENERAL_FITNESS",
          ]) as never,
          weeklyFrequency: randInt(3, 5),
          onboardingStartedAt: joinedAt,
          onboardingCompletedAt: new Date(joinedAt.getTime() + 2 * MS_PER_DAY),
          onboardingStep: 9,
          createdAt: joinedAt,
        },
      });

      // Membership
      await prisma.membership.create({
        data: {
          tenantId: box.id,
          athleteId: athlete.id,
          planId: plan.id,
          startDate: joinedAt,
          endDate: null,
          status: "ACTIVE",
          autoRenew: true,
          createdAt: joinedAt,
        },
      });

      athletes.push({
        id: athlete.id,
        userId: user.id,
        name: `${firstName} ${lastName}`,
        joinedAt,
      });
    }
    log(
      "athletes",
      `${wave.label}: ${wave.count} creados (total ${athletes.length})`,
    );
  }

  // ─── Classes ──────────────────────────────────────────────────────────────
  log("classes", "Programando clases (90d historia + 14d futuro)...");
  const classes: {
    id: string;
    wodId: string | null;
    startsAt: Date;
    capacity: number;
  }[] = [];

  for (
    let dayOffset = -DAYS_OF_HISTORY;
    dayOffset < DAYS_OF_FUTURE;
    dayOffset++
  ) {
    const day = daysFromToday(dayOffset);
    if (!ACTIVE_WEEKDAYS.includes(day.getDay())) continue;

    for (const hour of CLASS_HOURS) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, 0, 0, 0);

      // Solo 80% de los slots se programan (días con menos clases simulan
      // huecos reales)
      if (!chance(0.85)) continue;

      const wod = pick(wods);
      const coach = pick(coaches);

      const cls = await prisma.class.create({
        data: {
          tenantId: box.id,
          startsAt,
          durationMin: 60,
          capacity: 12,
          kind: "WOD",
          coachId: coach.id,
          wodId: wod.id,
          isActive: true,
          createdAt: daysAgo(95),
        },
      });
      classes.push({
        id: cls.id,
        wodId: wod.id,
        startsAt,
        capacity: cls.capacity,
      });
    }
  }
  log("classes", `${classes.length} clases programadas`);

  // ─── Bookings + Scores + PRs ─────────────────────────────────────────────
  log("bookings", "Generando reservas, asistencias, scores...");

  let bookingCount = 0;
  let attendedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;
  let scoreCount = 0;

  // Por cada atleta: distribuir ~8-12 clases/mes en su rango de actividad
  for (const athlete of athletes) {
    const monthsActive = Math.max(
      1,
      Math.floor(
        (TODAY.getTime() - athlete.joinedAt.getTime()) / (30 * MS_PER_DAY),
      ),
    );
    const targetBookings = randInt(8, 14) * monthsActive;

    // Sample N clases distintas en su rango
    const eligibleClasses = classes.filter(
      (c) => c.startsAt >= athlete.joinedAt,
    );
    const shuffled = [...eligibleClasses].sort(() => rand() - 0.5);
    const selected = shuffled.slice(
      0,
      Math.min(targetBookings, shuffled.length),
    );

    for (const cls of selected) {
      const isPast = cls.startsAt < TODAY;
      let status: "BOOKED" | "ATTENDED" | "NOSHOW" | "CANCELLED" = "BOOKED";
      let checkedInAt: Date | null = null;

      if (isPast) {
        const r = rand();
        if (r < 0.85) {
          status = "ATTENDED";
          checkedInAt = new Date(cls.startsAt.getTime() - 5 * 60 * 1000);
          attendedCount++;
        } else if (r < 0.93) {
          status = "NOSHOW";
          noShowCount++;
        } else {
          status = "CANCELLED";
          cancelledCount++;
        }
      }

      const booking = await prisma.booking
        .create({
          data: {
            tenantId: box.id,
            classId: cls.id,
            athleteId: athlete.id,
            status,
            bookedAt: new Date(
              cls.startsAt.getTime() - randInt(1, 48) * 60 * 60 * 1000,
            ),
            checkedInAt,
          },
        })
        .catch(() => null);

      if (!booking) continue;
      bookingCount++;

      // Score: ~70% de los ATTENDED registran score
      if (status === "ATTENDED" && cls.wodId && chance(0.7)) {
        const wod = wods.find((w) => w.id === cls.wodId);
        if (wod) {
          const value = generateScoreValue(wod.name, wod.scoreType);
          const scaling = pick([
            "RX",
            "RX",
            "RX",
            "SCALED",
            "SCALED",
            "RXPLUS",
          ]);
          const unit = scoreUnitFor(wod.scoreType);
          await prisma.score.create({
            data: {
              tenantId: box.id,
              wodId: cls.wodId,
              athleteId: athlete.id,
              classId: cls.id,
              value: String(value.toFixed(2)),
              unit,
              scaling: scaling as never,
              createdAt: cls.startsAt,
            },
          });
          scoreCount++;
        }
      }
    }
  }
  log(
    "bookings",
    `${bookingCount} bookings · ${attendedCount} attended · ${noShowCount} no-shows · ${cancelledCount} cancelled`,
  );
  log("scores", `${scoreCount} scores`);

  // ─── PRs en movimientos benchmark ────────────────────────────────────────
  log("prs", "Generando PRs benchmark...");
  const benchmarkSlugs = [
    "back-squat",
    "deadlift",
    "snatch",
    "clean-and-jerk",
    "shoulder-press",
    "bench-press",
  ];
  const benchmarkMovements = await prisma.movement.findMany({
    where: { tenantId: box.id, slug: { in: benchmarkSlugs } },
  });

  let prCount = 0;
  for (const athlete of athletes) {
    // Cada atleta tiene PRs en 2-4 movimientos
    const movements = [...benchmarkMovements]
      .sort(() => rand() - 0.5)
      .slice(0, randInt(2, 4));
    for (const m of movements) {
      const baseValue =
        m.slug === "deadlift"
          ? 130
          : m.slug === "back-squat"
            ? 110
            : m.slug === "snatch"
              ? 65
              : m.slug === "clean-and-jerk"
                ? 85
                : 60;
      const value = bellAround(baseValue, 0.18);
      await prisma.pR.create({
        data: {
          tenantId: box.id,
          athleteId: athlete.id,
          movementId: m.id,
          value: String(Math.round(value)),
          unit: "kg",
          achievedAt: new Date(
            athlete.joinedAt.getTime() + randInt(7, 60) * MS_PER_DAY,
          ),
        },
      });
      prCount++;
    }
  }
  log("prs", `${prCount} PRs`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  bar();
  log("done", "Seed completado.");
  log("login", `Owner:  owner@${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
  log("login", `Coach:  coach.alex@${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
  log("login", `Atleta de ejemplo: ${athletes[0]?.name}`);
  bar();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(TODAY.getTime() - n * MS_PER_DAY);
}

function daysFromToday(offset: number): Date {
  return new Date(TODAY.getTime() + offset * MS_PER_DAY);
}

function generateScoreValue(wodName: string, scoreType: string): number {
  // Realistic benchmark times/scores
  if (scoreType === "TIME") {
    const baseSec: Record<string, number> = {
      Fran: 5 * 60,
      Helen: 10 * 60,
      Diane: 8 * 60,
      Karen: 10 * 60,
      Grace: 4 * 60,
      Annie: 8 * 60,
    };
    return bellAround(baseSec[wodName] ?? 12 * 60, 0.22);
  }
  if (scoreType === "REPS") {
    const baseReps: Record<string, number> = { Cindy: 18, Murph: 1 };
    return bellAround(baseReps[wodName] ?? 200, 0.15);
  }
  if (scoreType === "WEIGHT") {
    return bellAround(80, 0.2);
  }
  if (scoreType === "ROUNDS_REPS") {
    return bellAround(15, 0.2);
  }
  return bellAround(100, 0.2);
}

function scoreUnitFor(scoreType: string): string {
  switch (scoreType) {
    case "TIME":
      return "seconds";
    case "REPS":
      return "reps";
    case "WEIGHT":
      return "kg";
    case "ROUNDS_REPS":
      return "rounds";
    default:
      return "score";
  }
}

async function deleteBoxCascade(boxId: string): Promise<void> {
  // Borrar en orden inverso de dependencias
  await prisma.pR.deleteMany({ where: { tenantId: boxId } });
  await prisma.score.deleteMany({ where: { tenantId: boxId } });
  await prisma.booking.deleteMany({ where: { tenantId: boxId } });
  await prisma.class.deleteMany({ where: { tenantId: boxId } });
  await prisma.wODMovement.deleteMany({
    where: { wod: { tenantId: boxId } },
  });
  await prisma.wOD.deleteMany({ where: { tenantId: boxId } });
  await prisma.membership.deleteMany({ where: { tenantId: boxId } });
  await prisma.membershipPlan.deleteMany({ where: { tenantId: boxId } });
  await prisma.athlete.deleteMany({ where: { tenantId: boxId } });
  await prisma.movement.deleteMany({ where: { tenantId: boxId } });
  await prisma.user.deleteMany({ where: { tenantId: boxId } });
  await prisma.box.delete({ where: { id: boxId } });
}

function previewSummary(): void {
  log(
    "preview",
    `Crearía Box '${SAFE_SLUG}', 1 owner, 3 coaches, ~95 movements, ${WOD_LIBRARY.length} WODs, 1 plan, ${WAVE_1_COUNT + WAVE_2_COUNT + WAVE_3_COUNT} atletas, ~310 clases, ~600 bookings, ~450 scores, ~120 PRs.`,
  );
}

main()
  .catch((err) => {
    console.error("seed FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
