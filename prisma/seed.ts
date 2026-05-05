import {
  PrismaClient,
  type Prisma,
  type WODType,
  type ScoreType,
} from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Andrés",
  "Sofía",
  "Miguel",
  "Camila",
  "Diego",
  "Valentina",
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
  "Mariana",
  "Patricio",
  "Andrea",
  "Cristian",
  "Paula",
  "Manuel",
  "Verónica",
];

const LAST_NAMES = [
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

const MOVEMENT_LIBRARY = [
  { name: "Back Squat", equipment: ["Barbell", "Plates", "Rack"] },
  { name: "Front Squat", equipment: ["Barbell", "Plates", "Rack"] },
  { name: "Deadlift", equipment: ["Barbell", "Plates"] },
  { name: "Clean", equipment: ["Barbell", "Plates"] },
  { name: "Snatch", equipment: ["Barbell", "Plates"] },
  { name: "Power Clean", equipment: ["Barbell", "Plates"] },
  { name: "Push Press", equipment: ["Barbell", "Plates"] },
  { name: "Strict Press", equipment: ["Barbell", "Plates"] },
  { name: "Thruster", equipment: ["Barbell", "Plates"] },
  { name: "Pull-up", equipment: ["Pull-up bar"] },
  { name: "Push-up", equipment: [] },
  { name: "Air Squat", equipment: [] },
  { name: "Box Jump", equipment: ["Box"] },
  { name: "Wall Ball", equipment: ["Med ball", "Wall target"] },
  { name: "Burpee", equipment: [] },
  { name: "Toes to Bar", equipment: ["Pull-up bar"] },
  { name: "Kettlebell Swing", equipment: ["Kettlebell"] },
  { name: "Double Under", equipment: ["Jump rope"] },
  { name: "Row", equipment: ["Rower"] },
  { name: "Run", equipment: [] },
];

type WODRecipe = {
  name: string;
  type: WODType;
  scoreType: ScoreType;
  description: string;
  timeCap?: number;
  movements: { name: string; reps?: number; weight?: number }[];
};

const WOD_LIBRARY: WODRecipe[] = [
  {
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
    name: "Diane",
    type: "FORTIME",
    scoreType: "TIME",
    description: "21-15-9 for time:\nDeadlift (102kg/70kg)\nHandstand push-up",
    timeCap: 15,
    movements: [
      { name: "Deadlift", reps: 21, weight: 102 },
      { name: "Push-up", reps: 21 },
    ],
  },
  {
    name: "Karen",
    type: "FORTIME",
    scoreType: "TIME",
    description: "150 wall balls (9kg/6kg) for time",
    timeCap: 20,
    movements: [{ name: "Wall Ball", reps: 150, weight: 9 }],
  },
  {
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
    name: "Annie",
    type: "FORTIME",
    scoreType: "TIME",
    description: "50-40-30-20-10 for time:\nDouble unders\nSit-ups",
    timeCap: 15,
    movements: [
      { name: "Double Under", reps: 50 },
      { name: "Push-up", reps: 50 },
    ],
  },
  {
    name: "Grace",
    type: "FORTIME",
    scoreType: "TIME",
    description: "30 clean & jerks (60kg/43kg) for time",
    timeCap: 10,
    movements: [{ name: "Clean", reps: 30, weight: 60 }],
  },
  {
    name: "Isabel",
    type: "FORTIME",
    scoreType: "TIME",
    description: "30 snatches (60kg/43kg) for time",
    timeCap: 10,
    movements: [{ name: "Snatch", reps: 30, weight: 60 }],
  },
  {
    name: "EMOM 10 Power Clean",
    type: "EMOM",
    scoreType: "WEIGHT",
    description: "EMOM 10 min: 3 power cleans @ 70% 1RM",
    movements: [{ name: "Power Clean", reps: 3 }],
  },
  {
    name: "Tabata Squats",
    type: "TABATA",
    scoreType: "REPS",
    description:
      "Tabata air squats (8 rounds: 20s on / 10s off). Score = total reps",
    movements: [{ name: "Air Squat" }],
  },
  {
    name: "Death by Burpees",
    type: "EMOM",
    scoreType: "REPS",
    description: "Min 1: 1 burpee, Min 2: 2 burpees… hasta que falles",
    movements: [{ name: "Burpee" }],
  },
  // STRENGTH WODs (1RM-style — disparan PRs)
  {
    name: "1RM Back Squat",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Back Squat" }],
  },
  {
    name: "1RM Front Squat",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Front Squat" }],
  },
  {
    name: "1RM Deadlift",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Deadlift" }],
  },
  {
    name: "1RM Clean",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Clean" }],
  },
  {
    name: "1RM Snatch",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 20 minutes",
    movements: [{ name: "Snatch" }],
  },
  {
    name: "1RM Strict Press",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Strict Press" }],
  },
  {
    name: "1RM Push Press",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Push Press" }],
  },
  {
    name: "1RM Thruster",
    type: "STRENGTH",
    scoreType: "WEIGHT",
    description: "Build to a heavy single in 15 minutes",
    movements: [{ name: "Thruster" }],
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randomScoreFor(scoreType: ScoreType): { value: number; unit: string } {
  switch (scoreType) {
    case "TIME":
      return { value: 180 + Math.floor(Math.random() * 600), unit: "s" }; // 3-13 min
    case "REPS":
      return { value: 80 + Math.floor(Math.random() * 200), unit: "reps" };
    case "WEIGHT":
      return { value: 40 + Math.floor(Math.random() * 120), unit: "kg" };
    case "ROUNDS_REPS": {
      const rounds = 3 + Math.floor(Math.random() * 12);
      const reps = Math.floor(Math.random() * 30);
      return { value: rounds + reps / 100, unit: "rounds" };
    }
  }
}

async function main() {
  console.log(
    "🌱 Seed extendido — limpiando datos previos del seed (no toca data real)…",
  );

  // ─── Boxes ────────────────────────────────────────────────────────────────────
  const box1 = await prisma.box.upsert({
    where: { slug: "iron-hands-polanco" },
    update: {},
    create: {
      slug: "iron-hands-polanco",
      name: "Iron Hands CrossFit · Polanco",
      locale: "es-MX",
      currency: "MXN",
      brandColor: "#19f08b",
    },
  });

  const box2 = await prisma.box.upsert({
    where: { slug: "demo-box-b" },
    update: {},
    create: {
      slug: "demo-box-b",
      name: "Demo Box B (isolation test)",
      locale: "es-MX",
      currency: "MXN",
    },
  });

  // Wipe seed-prefixed data for box1 to make seed idempotent + reproducible
  await prisma.bodyMetric.deleteMany({ where: { tenantId: box1.id } });
  await prisma.goal.deleteMany({ where: { tenantId: box1.id } });
  await prisma.pRAttempt.deleteMany({ where: { tenantId: box1.id } });
  await prisma.score.deleteMany({ where: { tenantId: box1.id } });
  await prisma.pR.deleteMany({ where: { tenantId: box1.id } });
  await prisma.booking.deleteMany({ where: { tenantId: box1.id } });
  await prisma.class.deleteMany({ where: { tenantId: box1.id } });
  await prisma.wODMovement.deleteMany({
    where: { wod: { tenantId: box1.id } },
  });
  await prisma.wOD.deleteMany({ where: { tenantId: box1.id } });
  await prisma.movement.deleteMany({ where: { tenantId: box1.id } });
  await prisma.streak.deleteMany({ where: { tenantId: box1.id } });
  await prisma.athlete.deleteMany({
    where: { tenantId: box1.id, id: { startsWith: "seed-" } },
  });

  // ─── Users (Owner + Coach + Athlete) ────────────────────────────────────────
  // Three demo accounts for dev login (NEXT_PUBLIC_DEV_LOGIN=1, password "dev"):
  //   owner@iron-hands.demo  → role OWNER  (full admin)
  //   coach@iron-hands.demo  → role COACH  (admin/coach surface)
  //   atleta@iron-hands.demo → role ATHLETE (atleta surface, linked to seed-ath-0)
  await prisma.user.upsert({
    where: { email: "owner@iron-hands.demo" },
    update: {},
    create: {
      id: `seed-owner-${box1.id}`,
      email: "owner@iron-hands.demo",
      name: "Iron Hands Owner",
      role: "OWNER",
      tenantId: box1.id,
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "coach@iron-hands.demo" },
    update: {},
    create: {
      id: `seed-coach-${box1.id}`,
      email: "coach@iron-hands.demo",
      name: "Coach Lobo",
      role: "COACH",
      tenantId: box1.id,
    },
  });

  // ─── Athletes (50 for box1) ──────────────────────────────────────────────────
  const athleteIds: string[] = [];
  const athleteData: Prisma.AthleteCreateManyInput[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 50 && athleteData.length < 50; i++) {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    const fullKey = `${firstName} ${lastName}`;
    if (usedNames.has(fullKey)) continue;
    usedNames.add(fullKey);

    const id = `seed-ath-${box1.id}-${athleteData.length}`;
    athleteIds.push(id);
    const status =
      athleteData.length < 42
        ? "ACTIVE"
        : athleteData.length < 47
          ? "PAUSED"
          : "DROPIN";
    athleteData.push({
      id,
      tenantId: box1.id,
      firstName,
      lastName,
      phone: `55${String(10000000 + Math.floor(Math.random() * 90000000))}`,
      status,
    });
  }
  await prisma.athlete.createMany({ data: athleteData });

  // Link first athlete to a demo User with role ATHLETE for dev login
  const firstAthleteId = athleteIds[0];
  if (firstAthleteId) {
    const athleteUser = await prisma.user.upsert({
      where: { email: "atleta@iron-hands.demo" },
      update: {},
      create: {
        id: `seed-ath-user-${box1.id}`,
        email: "atleta@iron-hands.demo",
        name: "Atleta Demo",
        role: "ATHLETE",
        tenantId: box1.id,
      },
    });
    await prisma.athlete.update({
      where: { id: firstAthleteId },
      data: { userId: athleteUser.id },
    });
  }

  // Box 2 isolation athlete
  await prisma.athlete.upsert({
    where: { id: `seed-isolation-${box2.id}` },
    update: {},
    create: {
      id: `seed-isolation-${box2.id}`,
      tenantId: box2.id,
      firstName: "Atlas",
      lastName: "BoxB",
      status: "ACTIVE",
    },
  });

  // ─── Movements ───────────────────────────────────────────────────────────────
  const movementByName = new Map<string, string>();
  for (const mv of MOVEMENT_LIBRARY) {
    const created = await prisma.movement.create({
      data: {
        tenantId: box1.id,
        name: mv.name,
        equipment: mv.equipment,
      },
    });
    movementByName.set(mv.name, created.id);
  }

  // ─── WODs ────────────────────────────────────────────────────────────────────
  const wodIds: { id: string; scoreType: ScoreType; type: WODType }[] = [];
  for (const recipe of WOD_LIBRARY) {
    const wod = await prisma.wOD.create({
      data: {
        tenantId: box1.id,
        name: recipe.name,
        type: recipe.type,
        scoreType: recipe.scoreType,
        description: recipe.description,
        timeCap: recipe.timeCap ?? null,
        movements: {
          create: (() => {
            // Dedupe by movementId (schema has @@unique([wodId, movementId])).
            // For repeated movements like Murph's "Run x2", we collapse and
            // sum reps so the WOD totals stay correct.
            const acc = new Map<
              string,
              {
                movementId: string;
                reps: number | null;
                weight: number | null;
                order: number;
              }
            >();
            recipe.movements.forEach((m, idx) => {
              const movementId = movementByName.get(m.name);
              if (!movementId)
                throw new Error(`Movement not seeded: ${m.name}`);
              const existing = acc.get(movementId);
              if (existing) {
                if (m.reps != null) {
                  existing.reps = (existing.reps ?? 0) + m.reps;
                }
              } else {
                acc.set(movementId, {
                  movementId,
                  reps: m.reps ?? null,
                  weight: m.weight ?? null,
                  order: idx,
                });
              }
            });
            return Array.from(acc.values());
          })(),
        },
      },
    });
    wodIds.push({
      id: wod.id,
      scoreType: recipe.scoreType,
      type: recipe.type,
    });
  }

  // ─── Classes (4 weeks: 2 past + this week + next) ────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekStart = new Date(monday);
  weekStart.setDate(weekStart.getDate() - 14); // 2 weeks back

  const classRows: Prisma.ClassCreateManyInput[] = [];
  const classRefs: { id: string; date: Date; wodId: string | null }[] = [];

  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffset);
    if (day.getDay() === 0) continue; // closed Sundays

    const slots = [7, 9, 12, 17, 19]; // hours
    for (const hour of slots) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, 0, 0, 0);
      const wod = pickRandom(wodIds);
      const id = `seed-class-${box1.id}-${dayOffset}-${hour}`;
      classRows.push({
        id,
        tenantId: box1.id,
        startsAt,
        durationMin: 60,
        capacity: hour === 19 ? 20 : 14,
        coachId: coach.id,
        wodId: wod.id,
      });
      classRefs.push({ id, date: startsAt, wodId: wod.id });
    }
  }
  await prisma.class.createMany({ data: classRows });

  // ─── Bookings + Scores (only past classes) ───────────────────────────────────
  const now = new Date();
  const bookingRows: Prisma.BookingCreateManyInput[] = [];
  const scoreRows: Prisma.ScoreCreateManyInput[] = [];

  for (const klass of classRefs) {
    const isPast = klass.date.getTime() < now.getTime();
    const klassRow = classRows.find((c) => c.id === klass.id)!;
    const capacity = klassRow.capacity!;
    // Fill 60-95% capacity for past classes, 30-70% for future
    const fillRatio = isPast
      ? 0.6 + Math.random() * 0.35
      : 0.3 + Math.random() * 0.4;
    const target = Math.min(capacity, Math.floor(capacity * fillRatio));

    const attendees = pickN(athleteIds.slice(0, 42), target); // ACTIVE only
    for (const athleteId of attendees) {
      const willAttend = isPast && Math.random() < 0.85;
      const willNoShow = isPast && !willAttend && Math.random() < 0.5;
      const status = isPast
        ? willAttend
          ? "ATTENDED"
          : willNoShow
            ? "NOSHOW"
            : "CANCELLED"
        : "BOOKED";

      bookingRows.push({
        tenantId: box1.id,
        classId: klass.id,
        athleteId,
        status,
        bookedAt: new Date(klass.date.getTime() - 24 * 3600 * 1000),
        checkedInAt:
          status === "ATTENDED"
            ? new Date(klass.date.getTime() + 5 * 60 * 1000)
            : null,
      });

      // Score for ATTENDED only, per WOD scoreType
      if (status === "ATTENDED" && klass.wodId) {
        const wodMeta = wodIds.find((w) => w.id === klass.wodId)!;
        const { value, unit } = randomScoreFor(wodMeta.scoreType);
        scoreRows.push({
          tenantId: box1.id,
          wodId: klass.wodId,
          athleteId,
          classId: klass.id,
          value,
          unit,
          scaling: Math.random() < 0.7 ? "RX" : "SCALED",
          createdAt: new Date(klass.date.getTime() + 50 * 60 * 1000),
        });
      }
    }
  }
  await prisma.booking.createMany({ data: bookingRows });
  await prisma.score.createMany({ data: scoreRows });

  // ─── PRs derived from STRENGTH scores ────────────────────────────────────────
  const strengthWodIds = wodIds
    .filter((w) => w.type === "STRENGTH")
    .map((w) => w.id);
  const strengthScores = scoreRows.filter((s) =>
    strengthWodIds.includes(s.wodId),
  );

  // Best score per (athlete, wod's single movement) → PR
  const prMap = new Map<string, Prisma.PRCreateManyInput>();
  for (const score of strengthScores) {
    if (score.scaling === "SCALED") continue;
    const wodEntry = wodIds.find((w) => w.id === score.wodId)!;
    if (wodEntry.type !== "STRENGTH") continue;
    // Find this WOD's single movement
    const wodMovement = await prisma.wODMovement.findFirst({
      where: { wodId: score.wodId },
    });
    if (!wodMovement) continue;
    const key = `${score.athleteId}::${wodMovement.movementId}`;
    const existing = prMap.get(key);
    if (!existing || Number(score.value) > Number(existing.value)) {
      prMap.set(key, {
        tenantId: box1.id,
        athleteId: score.athleteId,
        movementId: wodMovement.movementId,
        value: score.value,
        unit: score.unit,
        achievedAt: score.createdAt as Date,
      });
    }
  }
  if (prMap.size > 0) {
    await prisma.pR.createMany({ data: Array.from(prMap.values()) });
  }

  // ─── PRAttempt log (Tanda 1) ─────────────────────────────────────────────────
  // For each PR, fabricate 2-5 prior attempts that culminate in the current
  // best. This gives PRChart real shape (LineChart with progression deltas).
  const prAttemptRows: Prisma.PRAttemptCreateManyInput[] = [];
  for (const pr of prMap.values()) {
    const finalValue = Number(pr.value);
    const finalAt = pr.achievedAt as Date;
    const totalAttempts = 2 + Math.floor(Math.random() * 4); // 2-5
    // start ~5-25% below final
    const startValue = finalValue * (0.75 + Math.random() * 0.2);
    let prevBest: number | null = null;
    for (let i = 0; i < totalAttempts; i++) {
      const t = i / Math.max(1, totalAttempts - 1); // 0..1
      // Progressive growth with mild jitter
      const interp = startValue + (finalValue - startValue) * (0.3 + 0.7 * t);
      const value =
        i === totalAttempts - 1 ? finalValue : Math.round(interp * 4) / 4;
      // Ensure monotonic improvement (filter out non-improvements)
      if (prevBest !== null && value <= prevBest) continue;
      // Days back: 0 for last, scale earlier ones over up to 6 months
      const daysBack =
        i === totalAttempts - 1 ? 0 : Math.round(180 * (1 - t) + 5);
      const achievedAt = new Date(finalAt.getTime() - daysBack * 86400000);
      prAttemptRows.push({
        tenantId: box1.id,
        athleteId: pr.athleteId,
        movementId: pr.movementId,
        scoreId: null,
        value,
        unit: pr.unit,
        prevBest: prevBest === null ? null : prevBest,
        isCurrentBest: i === totalAttempts - 1,
        achievedAt,
      });
      prevBest = value;
    }
  }
  if (prAttemptRows.length > 0) {
    await prisma.pRAttempt.createMany({ data: prAttemptRows });
  }

  // ─── Goals (Tanda 2) ─────────────────────────────────────────────────────────
  // Mix per active athlete:
  //   - 1 ACTIVE PR goal (~10-15% above current best on a movement they PR'd)
  //   - 1 ACTIVE ATTENDANCE goal (24 classes in next 60 days)
  //   - 30% chance of an ACHIEVED PR goal (deadline past, target = current PR)
  const goalRows: Prisma.GoalCreateManyInput[] = [];
  const activeAthletes = athleteIds.slice(0, 42);
  const prsByAthlete = new Map<string, Prisma.PRCreateManyInput[]>();
  for (const pr of prMap.values()) {
    const arr = prsByAthlete.get(pr.athleteId) ?? [];
    arr.push(pr);
    prsByAthlete.set(pr.athleteId, arr);
  }

  for (const aId of activeAthletes) {
    const myPRs = prsByAthlete.get(aId) ?? [];
    if (myPRs.length > 0) {
      const pr = pickRandom(myPRs);
      const target =
        Math.round(Number(pr.value) * (1.1 + Math.random() * 0.05) * 4) / 4;
      const deadline = new Date();
      deadline.setDate(
        deadline.getDate() + 30 + Math.floor(Math.random() * 60),
      );
      const created = new Date();
      created.setDate(created.getDate() - 10 - Math.floor(Math.random() * 30));
      goalRows.push({
        tenantId: box1.id,
        athleteId: aId,
        movementId: pr.movementId,
        metric: "PR",
        targetValue: target,
        unit: pr.unit,
        startValue: Number(pr.value),
        deadline,
        status: "ACTIVE",
        createdAt: created,
      });

      // 30% chance of an achieved historical goal
      if (Math.random() < 0.3) {
        const pastDeadline = new Date(created.getTime() - 60 * 86400000);
        const achievedAt = new Date(pastDeadline.getTime() - 5 * 86400000);
        goalRows.push({
          tenantId: box1.id,
          athleteId: aId,
          movementId: pr.movementId,
          metric: "PR",
          targetValue: Math.round(Number(pr.value) * 0.9 * 4) / 4,
          unit: pr.unit,
          startValue: Math.round(Number(pr.value) * 0.7 * 4) / 4,
          deadline: pastDeadline,
          status: "ACHIEVED",
          achievedAt,
          createdAt: new Date(achievedAt.getTime() - 60 * 86400000),
        });
      }
    }

    // Attendance goal
    const attDeadline = new Date();
    attDeadline.setDate(attDeadline.getDate() + 60);
    goalRows.push({
      tenantId: box1.id,
      athleteId: aId,
      movementId: null,
      metric: "ATTENDANCE",
      targetValue: 24,
      unit: "clases",
      startValue: 0,
      deadline: attDeadline,
      status: "ACTIVE",
    });
  }
  if (goalRows.length > 0) {
    await prisma.goal.createMany({ data: goalRows });
  }

  // ─── BodyMetric (post-Tanda 2) ───────────────────────────────────────────────
  // Weekly weight + monthly body-fat readings over the past 90 days for ~50%
  // of active athletes. Realistic ranges with mild variance.
  const bodyMetricRows: Prisma.BodyMetricCreateManyInput[] = [];
  const trackedAthletes = activeAthletes.filter(() => Math.random() < 0.5);
  for (const aId of trackedAthletes) {
    const baseWeight = 60 + Math.random() * 30; // 60-90kg
    const baseFat = 12 + Math.random() * 13; // 12-25%
    // 13 weekly weight readings (~90 days)
    for (let w = 12; w >= 0; w--) {
      const measuredAt = new Date();
      measuredAt.setDate(measuredAt.getDate() - w * 7);
      const trend = (12 - w) * (Math.random() - 0.5) * 0.15; // mild drift
      const noise = (Math.random() - 0.5) * 0.6;
      const value = Math.round((baseWeight + trend + noise) * 10) / 10;
      bodyMetricRows.push({
        tenantId: box1.id,
        athleteId: aId,
        type: "WEIGHT",
        value,
        unit: "kg",
        measuredAt,
      });
    }
    // 3 monthly body-fat readings
    for (let m = 2; m >= 0; m--) {
      const measuredAt = new Date();
      measuredAt.setDate(measuredAt.getDate() - m * 30);
      const trend = (2 - m) * (Math.random() - 0.6) * 0.5;
      const value = Math.round((baseFat + trend) * 10) / 10;
      bodyMetricRows.push({
        tenantId: box1.id,
        athleteId: aId,
        type: "BODY_FAT",
        value,
        unit: "%",
        measuredAt,
      });
    }
  }
  if (bodyMetricRows.length > 0) {
    await prisma.bodyMetric.createMany({ data: bodyMetricRows });
  }

  // ─── Streaks (basic — set count to 0, real recompute via app) ────────────────
  // Initialize ATTENDANCE streak rows for active athletes
  await prisma.streak.createMany({
    data: athleteIds.slice(0, 42).map((athleteId) => ({
      tenantId: box1.id,
      athleteId,
      type: "ATTENDANCE" as const,
      count: 0,
    })),
  });

  // ─── Badges ───────────────────────────────────────────────────────────────────
  const badgesData = [
    {
      code: "first-class",
      name: "Primera clase",
      description: "Completaste tu primera clase",
      criteria: { type: "attendance", count: 1 },
    },
    {
      code: "streak-7",
      name: "7 días seguidos",
      description: "7 días de asistencia consecutivos",
      criteria: { type: "attendance_streak", count: 7 },
    },
    {
      code: "streak-30",
      name: "30 días seguidos",
      description: "30 días de asistencia consecutivos",
      criteria: { type: "attendance_streak", count: 30 },
    },
    {
      code: "first-pr",
      name: "PR desbloqueado",
      description: "Registraste tu primera marca personal",
      criteria: { type: "pr", count: 1 },
    },
    {
      code: "rx-warrior",
      name: "Guerrero RX",
      description: "5 WODs completados en RX",
      criteria: { type: "rx_count", count: 5 },
    },
    {
      code: "double-bw-deadlift",
      name: "Double bodyweight DL",
      description: "Deadlift de 2x tu peso corporal",
      criteria: { type: "ratio_pr", movement: "Deadlift", ratio: 2 },
    },
  ];

  for (const b of badgesData) {
    await prisma.badge.upsert({
      where: { tenantId_code: { tenantId: box1.id, code: b.code } },
      update: {},
      create: { tenantId: box1.id, ...b },
    });
  }

  console.log(`✅ Seed extendido completo:
  Box 1: ${box1.name} (${box1.id})
  Box 2: ${box2.name} (isolation)
  Atletas Box 1: ${athleteData.length} (42 ACTIVE, 5 PAUSED, 3 DROPIN)
  Movimientos: ${MOVEMENT_LIBRARY.length}
  WODs: ${WOD_LIBRARY.length} (incluye 8 STRENGTH 1RMs)
  Clases: ${classRows.length} (4 semanas: 2 pasadas + esta + próxima)
  Bookings: ${bookingRows.length}
  Scores: ${scoreRows.length}
  PRs: ${prMap.size}
  PRAttempts: ${prAttemptRows.length} (progresión histórica para charts)
  Goals: ${goalRows.length} (mix ACTIVE + ACHIEVED, PR + ATTENDANCE)
  BodyMetrics: ${bodyMetricRows.length} (~13 weights + 3 body-fat por atleta tracked)
  Badges: ${badgesData.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
