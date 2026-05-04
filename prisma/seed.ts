import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── Box 1: Iron Hands CrossFit Polanco ─────────────────────────────────────
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

  // ─── Box 2: for multi-tenant isolation test ──────────────────────────────────
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

  // ─── Athletes for Box 1 ───────────────────────────────────────────────────────
  const athleteData = [
    {
      firstName: "Andrés",
      lastName: "Vega",
      phone: "5512345678",
      status: "ACTIVE" as const,
    },
    {
      firstName: "Sofía",
      lastName: "Martínez",
      phone: "5598765432",
      status: "ACTIVE" as const,
    },
    {
      firstName: "Miguel",
      lastName: "Torres",
      phone: "5511112233",
      status: "ACTIVE" as const,
    },
    {
      firstName: "Camila",
      lastName: "Reyes",
      phone: "5544445555",
      status: "PAUSED" as const,
    },
    {
      firstName: "Diego",
      lastName: "Luna",
      phone: "5566667777",
      status: "ACTIVE" as const,
    },
  ];

  const athletes = await Promise.all(
    athleteData.map((data) =>
      prisma.athlete.upsert({
        where: { id: `seed-${data.firstName.toLowerCase()}-${box1.id}` },
        update: {},
        create: {
          id: `seed-${data.firstName.toLowerCase()}-${box1.id}`,
          tenantId: box1.id,
          ...data,
        },
      }),
    ),
  );

  // ─── Athlete for Box 2 (isolation test) ──────────────────────────────────────
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

  // ─── WODs for Box 1 ───────────────────────────────────────────────────────────
  const cindy = await prisma.wOD.upsert({
    where: { id: `seed-cindy-${box1.id}` },
    update: {},
    create: {
      id: `seed-cindy-${box1.id}`,
      tenantId: box1.id,
      name: "Cindy",
      type: "AMRAP",
      description: "AMRAP 20 min: 5 pull-ups, 10 push-ups, 15 air squats",
      scoreType: "ROUNDS_REPS",
      timeCap: 1200,
    },
  });

  await prisma.wOD.upsert({
    where: { id: `seed-emom-${box1.id}` },
    update: {},
    create: {
      id: `seed-emom-${box1.id}`,
      tenantId: box1.id,
      name: "EMOM 10 Power Clean",
      type: "EMOM",
      description: "EMOM 10 min: 3 power cleans @ 70% 1RM",
      scoreType: "WEIGHT",
    },
  });

  // ─── Classes for Box 1 ────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Promise.all([
    prisma.class.upsert({
      where: { id: `seed-class-morning-${box1.id}` },
      update: {},
      create: {
        id: `seed-class-morning-${box1.id}`,
        tenantId: box1.id,
        startsAt: new Date(today.getTime() + 7 * 60 * 60 * 1000),
        durationMin: 60,
        capacity: 12,
        wodId: cindy.id,
      },
    }),
    prisma.class.upsert({
      where: { id: `seed-class-noon-${box1.id}` },
      update: {},
      create: {
        id: `seed-class-noon-${box1.id}`,
        tenantId: box1.id,
        startsAt: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        durationMin: 60,
        capacity: 16,
        wodId: cindy.id,
      },
    }),
    prisma.class.upsert({
      where: { id: `seed-class-evening-${box1.id}` },
      update: {},
      create: {
        id: `seed-class-evening-${box1.id}`,
        tenantId: box1.id,
        startsAt: new Date(today.getTime() + 18.5 * 60 * 60 * 1000),
        durationMin: 60,
        capacity: 20,
      },
    }),
  ]);

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
  ];

  await Promise.all(
    badgesData.map((b) =>
      prisma.badge.upsert({
        where: { tenantId_code: { tenantId: box1.id, code: b.code } },
        update: {},
        create: { tenantId: box1.id, ...b },
      }),
    ),
  );

  console.log(`Seed completo:
  - Box 1: ${box1.name} (${box1.id})
  - Box 2: ${box2.name} (${box2.id}) [isolation test]
  - Atletas Box 1: ${athletes.length}
  - WODs: 2 (Cindy + EMOM Power Clean)
  - Clases hoy: 3
  - Badges: ${badgesData.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
