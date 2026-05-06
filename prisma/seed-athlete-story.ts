/**
 * seed-athlete-story.ts
 *
 * Sobre-escribe los datos del atleta protagonista (`atleta@iron-hands.demo`)
 * con una historia coherente de 90 días — narrativa "consistente con racha viva".
 *
 * Uso:
 *   pnpm db:seed         # primero — base del box (50 atletas, 4 semanas)
 *   pnpm db:seed:story   # después — sobreescribe al atleta protagonista
 *
 * No toca al resto del box ni al schema. Idempotente.
 */

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const ATHLETE_EMAIL = "atleta@iron-hands.demo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number, hours = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// ─── Narrativa: 5 PRs explícitos con progresión ───────────────────────────────

type PRStory = {
  slug: string;
  unit: "kg" | "reps";
  attempts: { value: number; daysAgo: number }[];
};

const PR_STORIES: PRStory[] = [
  // Back Squat: 100 → 110 → 115 → 120 (3 attempts visibles)
  {
    slug: "back-squat",
    unit: "kg",
    attempts: [
      { value: 110, daysAgo: 75 },
      { value: 115, daysAgo: 35 },
      { value: 120, daysAgo: 8 },
    ],
  },
  // Deadlift: 130 → 140 → 145
  {
    slug: "deadlift",
    unit: "kg",
    attempts: [
      { value: 140, daysAgo: 60 },
      { value: 145, daysAgo: 15 },
    ],
  },
  // Clean: 70 → 75 → 80
  {
    slug: "clean",
    unit: "kg",
    attempts: [
      { value: 75, daysAgo: 50 },
      { value: 80, daysAgo: 21 },
    ],
  },
  // Snatch: 55 → 60 → 65
  {
    slug: "snatch",
    unit: "kg",
    attempts: [
      { value: 60, daysAgo: 65 },
      { value: 65, daysAgo: 25 },
    ],
  },
  // Pull-up max reps: 10 → 12 → 15
  {
    slug: "pull-up",
    unit: "reps",
    attempts: [
      { value: 12, daysAgo: 55 },
      { value: 15, daysAgo: 12 },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Buscar el atleta protagonista vía user
  const user = await prisma.user.findUnique({
    where: { email: ATHLETE_EMAIL },
    select: { id: true, tenantId: true },
  });
  if (!user) {
    throw new Error(
      `User ${ATHLETE_EMAIL} not found. Corré 'pnpm db:seed' primero.`,
    );
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: user.id },
    select: { id: true, tenantId: true, firstName: true, lastName: true },
  });
  if (!athlete) {
    throw new Error(
      `Athlete linkeado a ${ATHLETE_EMAIL} no existe. Corré 'pnpm db:seed' primero.`,
    );
  }

  const tenantId = athlete.tenantId;
  console.log(
    `→ Atleta: ${athlete.firstName} ${athlete.lastName} (${athlete.id})`,
  );

  // 2. Limpiar SOLO los datos del atleta protagonista
  console.log("→ Limpiando datos previos del atleta...");
  await prisma.surveyResponse.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });
  await prisma.bodyMetric.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });
  await prisma.goal.deleteMany({ where: { athleteId: athlete.id, tenantId } });
  await prisma.pRAttempt.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });
  await prisma.pR.deleteMany({ where: { athleteId: athlete.id, tenantId } });
  await prisma.score.deleteMany({ where: { athleteId: athlete.id, tenantId } });
  await prisma.booking.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });
  await prisma.streak.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });
  await prisma.achievement.deleteMany({
    where: { athleteId: athlete.id, tenantId },
  });

  // 3. Buscar movements del box (necesarios para PRs)
  const movementSlugs = PR_STORIES.map((p) => p.slug);
  const movementRows = await prisma.movement.findMany({
    where: { tenantId, slug: { in: movementSlugs } },
    select: { id: true, slug: true },
  });
  const movementBySlug = new Map(movementRows.map((m) => [m.slug, m.id]));
  for (const slug of movementSlugs) {
    if (!movementBySlug.has(slug)) {
      throw new Error(
        `Movement '${slug}' no existe. Corré 'pnpm db:seed' primero.`,
      );
    }
  }

  // 4. Buscar clases del box en últimos 90d (para asistencias) + futuras 7d (booking futuro)
  const now = new Date();
  const cutoff90 = daysAgo(90, 0);
  const past90Classes = await prisma.class.findMany({
    where: {
      tenantId,
      startsAt: { gte: cutoff90, lt: now },
      isActive: true,
    },
    select: { id: true, startsAt: true, wodId: true },
    orderBy: { startsAt: "asc" },
  });

  const futureClasses = await prisma.class.findMany({
    where: {
      tenantId,
      startsAt: { gte: now },
      isActive: true,
    },
    select: { id: true, startsAt: true, capacity: true },
    orderBy: { startsAt: "asc" },
  });

  console.log(
    `→ ${past90Classes.length} clases pasadas en 90d, ${futureClasses.length} futuras`,
  );
  if (past90Classes.length === 0) {
    throw new Error("No hay clases pasadas. ¿Está la DB inicializada?");
  }

  // 5. Distribuir asistencias: 42 ATTENDED total, denser en últimos 15d
  // Bucket: días 60-90 atrás → 10, días 30-60 → 14, días 15-30 → 8, últimos 15 → 12
  const buckets = [
    { from: 60, to: 90, count: 10 },
    { from: 30, to: 60, count: 14 },
    { from: 15, to: 30, count: 8 },
  ];
  const recentBucket = { from: 0, to: 15, count: 12 };

  function classesInRange(fromDays: number, toDays: number) {
    const fromDate = daysAgo(toDays, 0);
    const toDate = daysAgo(fromDays, 23);
    return past90Classes.filter(
      (c) => c.startsAt >= fromDate && c.startsAt <= toDate,
    );
  }

  const attendedClassIds = new Set<string>();
  const noshowClassIds = new Set<string>();
  const cancelledClassIds = new Set<string>();
  const bookingRows: Prisma.BookingCreateManyInput[] = [];
  const scoreRows: Prisma.ScoreCreateManyInput[] = [];

  // WODs scoreType lookup
  const wodIds = Array.from(
    new Set(past90Classes.map((c) => c.wodId).filter((x): x is string => !!x)),
  );
  const wods = await prisma.wOD.findMany({
    where: { id: { in: wodIds } },
    select: { id: true, scoreType: true, type: true },
  });
  const wodById = new Map(wods.map((w) => [w.id, w]));

  function fakeScoreFor(scoreType: string): { value: number; unit: string } {
    switch (scoreType) {
      case "TIME":
        return {
          value: 180 + Math.random() * 600, // 3-13 min en segundos
          unit: "s",
        };
      case "REPS":
        return {
          value: 80 + Math.floor(Math.random() * 200),
          unit: "reps",
        };
      case "WEIGHT":
        return {
          value: 70 + Math.floor(Math.random() * 70),
          unit: "kg",
        };
      case "ROUNDS_REPS":
        return {
          value: 3 + Math.random() * 11,
          unit: "rounds",
        };
      default:
        return { value: 100, unit: "reps" };
    }
  }

  // Asistencias buckets antiguos (random spread)
  for (const bucket of buckets) {
    const pool = classesInRange(bucket.from, bucket.to);
    if (pool.length === 0) continue;
    const picks = pickN(pool, Math.min(bucket.count, pool.length));
    for (const klass of picks) {
      attendedClassIds.add(klass.id);
      bookingRows.push({
        tenantId,
        classId: klass.id,
        athleteId: athlete.id,
        status: "ATTENDED",
        bookedAt: new Date(klass.startsAt.getTime() - 24 * 3600 * 1000),
        checkedInAt: new Date(klass.startsAt.getTime() + 5 * 60 * 1000),
      });
      if (klass.wodId && wodById.has(klass.wodId)) {
        const wod = wodById.get(klass.wodId)!;
        const { value, unit } = fakeScoreFor(wod.scoreType);
        scoreRows.push({
          tenantId,
          wodId: klass.wodId,
          athleteId: athlete.id,
          classId: klass.id,
          value,
          unit,
          scaling: Math.random() < 0.7 ? "RX" : "SCALED",
          createdAt: new Date(klass.startsAt.getTime() + 50 * 60 * 1000),
        });
      }
    }
  }

  // Asistencias recientes (últimos 15d) — narrativa explícita
  // Garantizar racha 7d: ATTENDED en CADA día con clase de los últimos 7
  // Para los 8 días anteriores (8-15 atrás): 5 ATTENDED + 1 NOSHOW + 2 CANCELLED
  const recentPool = classesInRange(recentBucket.from, recentBucket.to);
  // Agrupar por día para garantizar al menos 1 ATTENDED por día en últimos 7
  const byDay = new Map<string, typeof recentPool>();
  for (const c of recentPool) {
    const key = c.startsAt.toISOString().slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(c);
    byDay.set(key, arr);
  }

  // Días 0-6 atrás: 1 ATTENDED por día (racha viva)
  let recentNoshowCount = 0;
  let recentCancelledCount = 0;
  for (let d = 0; d <= 6; d++) {
    const dayKey = daysAgo(d, 0).toISOString().slice(0, 10);
    const dayClasses = byDay.get(dayKey);
    if (!dayClasses || dayClasses.length === 0) continue;
    // Pick una clase del día
    const klass = dayClasses[0];
    if (attendedClassIds.has(klass.id) || noshowClassIds.has(klass.id))
      continue;
    attendedClassIds.add(klass.id);
    recentAttendedCount++;
    bookingRows.push({
      tenantId,
      classId: klass.id,
      athleteId: athlete.id,
      status: "ATTENDED",
      bookedAt: new Date(klass.startsAt.getTime() - 24 * 3600 * 1000),
      checkedInAt: new Date(klass.startsAt.getTime() + 5 * 60 * 1000),
    });
    if (klass.wodId && wodById.has(klass.wodId)) {
      const wod = wodById.get(klass.wodId)!;
      const { value, unit } = fakeScoreFor(wod.scoreType);
      scoreRows.push({
        tenantId,
        wodId: klass.wodId,
        athleteId: athlete.id,
        classId: klass.id,
        value,
        unit,
        scaling: "RX",
        createdAt: new Date(klass.startsAt.getTime() + 50 * 60 * 1000),
      });
    }
  }

  // Días 7-14 atrás: 5 ATTENDED + 1 NOSHOW + 2 CANCELLED
  const olderRecentClasses: typeof recentPool = [];
  for (let d = 7; d <= 14; d++) {
    const dayKey = daysAgo(d, 0).toISOString().slice(0, 10);
    const dayClasses = byDay.get(dayKey);
    if (!dayClasses) continue;
    olderRecentClasses.push(...dayClasses);
  }
  const olderPicked = pickN(olderRecentClasses, 8);
  for (let i = 0; i < olderPicked.length; i++) {
    const klass = olderPicked[i];
    if (attendedClassIds.has(klass.id)) continue;
    let status: "ATTENDED" | "NOSHOW" | "CANCELLED";
    if (i < 5) {
      status = "ATTENDED";
      attendedClassIds.add(klass.id);
    } else if (i === 5) {
      status = "NOSHOW";
      noshowClassIds.add(klass.id);
      recentNoshowCount++;
    } else {
      status = "CANCELLED";
      cancelledClassIds.add(klass.id);
      recentCancelledCount++;
    }
    bookingRows.push({
      tenantId,
      classId: klass.id,
      athleteId: athlete.id,
      status,
      bookedAt: new Date(klass.startsAt.getTime() - 24 * 3600 * 1000),
      checkedInAt:
        status === "ATTENDED"
          ? new Date(klass.startsAt.getTime() + 5 * 60 * 1000)
          : null,
    });
    if (status === "ATTENDED" && klass.wodId && wodById.has(klass.wodId)) {
      const wod = wodById.get(klass.wodId)!;
      const { value, unit } = fakeScoreFor(wod.scoreType);
      scoreRows.push({
        tenantId,
        wodId: klass.wodId,
        athleteId: athlete.id,
        classId: klass.id,
        value,
        unit,
        scaling: Math.random() < 0.8 ? "RX" : "SCALED",
        createdAt: new Date(klass.startsAt.getTime() + 50 * 60 * 1000),
      });
    }
  }

  // 6. Booking futuro: la próxima clase disponible 24-48h
  const nextClass = futureClasses.find((c) => {
    const hoursAhead = (c.startsAt.getTime() - now.getTime()) / (3600 * 1000);
    return hoursAhead >= 12 && hoursAhead <= 48;
  });
  if (nextClass) {
    bookingRows.push({
      tenantId,
      classId: nextClass.id,
      athleteId: athlete.id,
      status: "BOOKED",
      bookedAt: now,
      checkedInAt: null,
    });
  }

  await prisma.booking.createMany({ data: bookingRows });
  await prisma.score.createMany({ data: scoreRows });

  console.log(
    `→ ${attendedClassIds.size} ATTENDED, ${recentNoshowCount} NOSHOW, ${recentCancelledCount} CANCELLED, 1 BOOKED futuro`,
  );

  // 7. PRs + PRAttempts (5 movimientos con progresión explícita)
  const prRows: Prisma.PRCreateManyInput[] = [];
  const prAttemptRows: Prisma.PRAttemptCreateManyInput[] = [];

  for (const story of PR_STORIES) {
    const movementId = movementBySlug.get(story.slug)!;
    const sortedAttempts = [...story.attempts].sort(
      (a, b) => b.daysAgo - a.daysAgo,
    );
    let prevBest: number | null = null;
    for (let i = 0; i < sortedAttempts.length; i++) {
      const a = sortedAttempts[i];
      const isLast = i === sortedAttempts.length - 1;
      prAttemptRows.push({
        tenantId,
        athleteId: athlete.id,
        movementId,
        scoreId: null,
        value: a.value,
        unit: story.unit,
        prevBest,
        isCurrentBest: isLast,
        achievedAt: daysAgo(a.daysAgo, 19),
      });
      if (isLast) {
        prRows.push({
          tenantId,
          athleteId: athlete.id,
          movementId,
          value: a.value,
          unit: story.unit,
          achievedAt: daysAgo(a.daysAgo, 19),
        });
      }
      prevBest = a.value;
    }
  }

  await prisma.pR.createMany({ data: prRows });
  await prisma.pRAttempt.createMany({ data: prAttemptRows });
  console.log(`→ ${prRows.length} PRs, ${prAttemptRows.length} PRAttempts`);

  // 8. Goals: 1 ACTIVE PR (~67%), 1 ACTIVE ATTENDANCE, 1 ACHIEVED histórica
  const backSquatId = movementBySlug.get("back-squat")!;
  const deadlineFuture = new Date();
  deadlineFuture.setDate(deadlineFuture.getDate() + 30);
  const goalCreated = daysAgo(75, 12);

  const goalRows: Prisma.GoalCreateManyInput[] = [
    {
      tenantId,
      athleteId: athlete.id,
      movementId: backSquatId,
      metric: "PR",
      targetValue: 130,
      unit: "kg",
      startValue: 100, // cuando se creó, PR era 100; ahora es 120 → 67% progreso
      deadline: deadlineFuture,
      status: "ACTIVE",
      createdAt: goalCreated,
    },
    {
      tenantId,
      athleteId: athlete.id,
      movementId: null,
      metric: "ATTENDANCE",
      targetValue: 20,
      unit: "clases",
      startValue: 0,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 18);
        return d;
      })(),
      status: "ACTIVE",
      createdAt: daysAgo(12, 9),
    },
    {
      tenantId,
      athleteId: athlete.id,
      movementId: backSquatId,
      metric: "PR",
      targetValue: 110,
      unit: "kg",
      startValue: 95,
      deadline: daysAgo(70, 12),
      status: "ACHIEVED",
      achievedAt: daysAgo(75, 14),
      createdAt: daysAgo(120, 9),
    },
  ];
  await prisma.goal.createMany({ data: goalRows });
  console.log(`→ ${goalRows.length} goals (2 ACTIVE + 1 ACHIEVED)`);

  // 9. BodyMetrics: 13 weeklies + 3 monthly body fat (90d)
  const baseWeight = 78;
  const baseFat = 18;
  const bodyMetricRows: Prisma.BodyMetricCreateManyInput[] = [];
  for (let w = 12; w >= 0; w--) {
    const measuredAt = daysAgo(w * 7, 8);
    // Trend: pierde ~3kg en 90d
    const trend = -((12 - w) / 12) * 3;
    const noise = (Math.random() - 0.5) * 0.4;
    const value = Math.round((baseWeight + trend + noise) * 10) / 10;
    bodyMetricRows.push({
      tenantId,
      athleteId: athlete.id,
      type: "WEIGHT",
      value,
      unit: "kg",
      measuredAt,
    });
  }
  for (let m = 2; m >= 0; m--) {
    const measuredAt = daysAgo(m * 30, 8);
    const trend = -((2 - m) / 2) * 3; // 18 → 15
    const value = Math.round((baseFat + trend) * 10) / 10;
    bodyMetricRows.push({
      tenantId,
      athleteId: athlete.id,
      type: "BODY_FAT",
      value,
      unit: "%",
      measuredAt,
    });
  }
  await prisma.bodyMetric.createMany({ data: bodyMetricRows });
  console.log(`→ ${bodyMetricRows.length} body metrics (12 weight + 3 fat)`);

  // 10. Streak ATTENDANCE = 7
  await prisma.streak.create({
    data: {
      tenantId,
      athleteId: athlete.id,
      type: "ATTENDANCE",
      count: 7,
      lastEventAt: daysAgo(0, 9),
    },
  });
  console.log("→ Streak ATTENDANCE = 7");

  // 11. Survey response READINESS hoy
  const readinessSurvey = await prisma.survey.findFirst({
    where: { tenantId, kind: "READINESS", isActive: true },
    select: { id: true },
  });
  if (readinessSurvey) {
    const todayStart = new Date();
    todayStart.setUTCHours(8, 30, 0, 0);
    await prisma.surveyResponse.create({
      data: {
        tenantId,
        surveyId: readinessSurvey.id,
        athleteId: athlete.id,
        answers: { energy: "high", sleep: "great", soreness: "none" },
        completedAt: todayStart,
      },
    });
    console.log("→ Readiness survey: respondida hoy (high/great/none)");
  }

  // 12. Achievement: badges desbloqueados
  const earnedBadgeCodes = [
    "first-class",
    "first-pr",
    "rx-warrior",
    "streak-7",
  ];
  const badges = await prisma.badge.findMany({
    where: { tenantId, code: { in: earnedBadgeCodes } },
    select: { id: true, code: true },
  });
  const achievementRows: Prisma.AchievementCreateManyInput[] = badges.map(
    (b, idx) => ({
      tenantId,
      athleteId: athlete.id,
      badgeId: b.id,
      earnedAt: daysAgo(60 - idx * 15, 18),
    }),
  );
  if (achievementRows.length > 0) {
    await prisma.achievement.createMany({ data: achievementRows });
    console.log(`→ ${achievementRows.length} achievements unlocked`);
  }

  console.log(`
✅ Athlete story sembrada:
   ${athlete.firstName} ${athlete.lastName} (${ATHLETE_EMAIL})
   - Asistencias 90d: ${attendedClassIds.size} ATTENDED
   - Racha activa: 7 días
   - Scores: ${scoreRows.length}
   - PRs: ${prRows.length} (back-squat 120kg, deadlift 145kg, clean 80kg, snatch 65kg, pull-up 15)
   - PRAttempts: ${prAttemptRows.length}
   - Goals: 2 ACTIVE + 1 ACHIEVED
   - Body metrics: ${bodyMetricRows.length}
   - Próxima reserva: ${nextClass ? nextClass.startsAt.toLocaleString() : "ninguna disponible 24-48h"}

   Login: atleta@iron-hands.demo / dev
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
