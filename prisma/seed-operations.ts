/**
 * seed-operations.ts
 *
 * Siembra la operación del box: planes de membresía, memberships con
 * altas/bajas/pausas/cancelaciones, pagos históricos + morosos, anuncios
 * y eventos de auditoría.
 *
 * Idempotente: limpia y recrea su propia data por tenant del primer Box.
 *
 * Uso:
 *   pnpm db:seed       # base
 *   pnpm db:seed:ops   # planes + membresías + pagos + comms + audit
 *   pnpm db:seed:story # atleta protagonista (opcional)
 */

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number, hours = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hours = 12): Date {
  return daysAgo(-n, hours);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // 1. Localizar el primer box (iron-hands-polanco) y sus atletas
  const box = await prisma.box.findUnique({
    where: { slug: "iron-hands-polanco" },
    select: { id: true, name: true },
  });
  if (!box) {
    throw new Error(
      "Box iron-hands-polanco no existe. Corré 'pnpm db:seed' primero.",
    );
  }
  const tenantId = box.id;
  console.log(`→ Box: ${box.name} (${tenantId})`);

  const athletes = await prisma.athlete.findMany({
    where: { tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  if (athletes.length === 0) {
    throw new Error("No hay atletas. Corré 'pnpm db:seed' primero.");
  }
  console.log(`→ ${athletes.length} atletas encontrados`);

  // Owner & coach lookup
  const owner = await prisma.user.findUnique({
    where: { email: "owner@iron-hands.demo" },
    select: { id: true },
  });
  const coach = await prisma.user.findUnique({
    where: { email: "coach@iron-hands.demo" },
    select: { id: true, name: true },
  });

  // 2. Limpiar data previa de operación
  console.log(
    "→ Limpiando memberships, payments, announcements, audit events...",
  );
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.membership.deleteMany({ where: { tenantId } });
  await prisma.membershipPlan.deleteMany({ where: { tenantId } });
  await prisma.announcement.deleteMany({ where: { tenantId } });
  await prisma.auditEvent.deleteMany({ where: { tenantId } });

  // 3. Planes
  const plansData = [
    {
      name: "Mensual Ilimitado",
      type: "UNLIMITED" as const,
      price: 2500,
      classesPerMonth: null,
      durationDays: 30,
    },
    {
      name: "Mensual 12 clases",
      type: "MONTHLY" as const,
      price: 1500,
      classesPerMonth: 12,
      durationDays: 30,
    },
    {
      name: "Anual Ilimitado",
      type: "ANNUAL" as const,
      price: 24000,
      classesPerMonth: null,
      durationDays: 365,
    },
    {
      name: "Drop-in",
      type: "DROPIN" as const,
      price: 250,
      classesPerMonth: 1,
      durationDays: 1,
    },
  ];
  const plans = await Promise.all(
    plansData.map((p) =>
      prisma.membershipPlan.create({
        data: { tenantId, currency: "MXN", isActive: true, ...p },
      }),
    ),
  );
  const [planUnlimited, planMonthly, planAnnual, planDropin] = plans;
  console.log(`→ ${plans.length} planes creados`);

  // 4. Memberships con narrativa de operación real
  // 50 atletas → distribuir:
  //   - 30 ACTIVE estables (membresías 1-12 meses)
  //   - 4 ACTIVE nuevas este mes (alta reciente)
  //   - 2 ACTIVE nuevas esta semana (alta súper reciente)
  //   - 5 PAUSED (pausa por viaje/lesión)
  //   - 4 CANCELLED último mes (ex-clientes con razón)
  //   - 3 EXPIRED morosos (vencidos sin renovar — para alerta)
  //   - 2 sin membership (DROPIN ocasional)

  const activeAthletes = athletes.filter((a) => a.status === "ACTIVE");
  const pausedAthletes = athletes.filter((a) => a.status === "PAUSED");
  const dropinAthletes = athletes.filter((a) => a.status === "DROPIN");

  const membershipRows: Prisma.MembershipCreateManyInput[] = [];
  const paymentRows: Prisma.PaymentCreateManyInput[] = [];
  const auditRows: Prisma.AuditEventCreateManyInput[] = [];

  // Helper para crear pagos históricos para una membership
  function paymentsForMembership(args: {
    membershipId: string;
    athleteName: string;
    plan: {
      id: string;
      name: string;
      price: number;
      durationDays: number | null;
    };
    startDate: Date;
    endDate: Date | null;
    monthsHistorical: number;
  }) {
    const { membershipId, plan, startDate, monthsHistorical } = args;
    const gateways: Array<"MERCADOPAGO" | "STRIPE" | "CASH"> = [
      "MERCADOPAGO",
      "MERCADOPAGO",
      "MERCADOPAGO",
      "STRIPE",
      "STRIPE",
      "CASH",
    ];
    for (let i = 0; i < monthsHistorical; i++) {
      const monthOffset = monthsHistorical - i;
      const paidAt = daysAgo(monthOffset * 30, 10);
      paymentRows.push({
        tenantId,
        membershipId,
        amount: plan.price,
        currency: "MXN",
        gateway: pickRandom(gateways),
        status: "PAID",
        paidAt,
        notes: `Mensualidad ${plan.name}`,
        createdAt: new Date(paidAt.getTime() - 2 * 3600 * 1000),
      });
    }
    void startDate;
  }

  // 4.1 ACTIVE estables (30) — distribuir entre planes principales
  for (let i = 0; i < Math.min(30, activeAthletes.length); i++) {
    const athlete = activeAthletes[i];
    const plan =
      i % 3 === 0 ? planUnlimited : i % 3 === 1 ? planMonthly : planAnnual;
    const ageMonths = 1 + Math.floor(Math.random() * 12); // 1-12 meses de antigüedad
    const startDate = daysAgo(ageMonths * 30, 9);
    const endDate = daysFromNow(15 + Math.floor(Math.random() * 15), 23);
    const membershipId = `seed-mem-${athlete.id}-active`;
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: plan.id,
      startDate,
      endDate,
      status: "ACTIVE",
      autoRenew: true,
      createdAt: startDate,
    });
    paymentsForMembership({
      membershipId,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      plan: {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        durationDays: plan.durationDays,
      },
      startDate,
      endDate,
      monthsHistorical: Math.min(ageMonths, 6), // hasta 6 meses de pagos
    });
  }

  // 4.2 ACTIVE nuevas este mes (4) — alta reciente con 0-1 pagos
  for (let i = 30; i < Math.min(34, activeAthletes.length); i++) {
    const athlete = activeAthletes[i];
    const plan = i % 2 === 0 ? planUnlimited : planMonthly;
    const startDate = daysAgo(8 + Math.floor(Math.random() * 18), 10); // 8-25d atrás
    const endDate = daysFromNow(30 - Math.floor(Math.random() * 10), 23);
    const membershipId = `seed-mem-${athlete.id}-newmonth`;
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: plan.id,
      startDate,
      endDate,
      status: "ACTIVE",
      autoRenew: true,
      createdAt: startDate,
    });
    // 1 pago al alta
    paymentRows.push({
      tenantId,
      membershipId,
      amount: Number(plan.price),
      currency: "MXN",
      gateway: pickRandom(["MERCADOPAGO", "STRIPE"] as const),
      status: "PAID",
      paidAt: new Date(startDate.getTime() + 30 * 60 * 1000),
      notes: `Alta — ${plan.name}`,
      createdAt: startDate,
    });
    auditRows.push({
      tenantId,
      actorId: owner?.id ?? null,
      action: "MEMBERSHIP_ASSIGNED",
      targetType: "Membership",
      targetId: membershipId,
      metadata: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        planName: plan.name,
        amount: Number(plan.price),
      },
      createdAt: startDate,
    });
    auditRows.push({
      tenantId,
      actorId: owner?.id ?? null,
      action: "PAYMENT_REGISTERED",
      targetType: "Payment",
      targetId: `seed-pay-${membershipId}`,
      metadata: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        amount: Number(plan.price),
      },
      createdAt: new Date(startDate.getTime() + 30 * 60 * 1000),
    });
  }

  // 4.3 ACTIVE nuevas esta semana (2)
  for (let i = 34; i < Math.min(36, activeAthletes.length); i++) {
    const athlete = activeAthletes[i];
    const plan = planUnlimited;
    const startDate = daysAgo(1 + Math.floor(Math.random() * 5), 10);
    const endDate = daysFromNow(28, 23);
    const membershipId = `seed-mem-${athlete.id}-newweek`;
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: plan.id,
      startDate,
      endDate,
      status: "ACTIVE",
      autoRenew: true,
      createdAt: startDate,
    });
    paymentRows.push({
      tenantId,
      membershipId,
      amount: Number(plan.price),
      currency: "MXN",
      gateway: "MERCADOPAGO",
      status: "PAID",
      paidAt: new Date(startDate.getTime() + 15 * 60 * 1000),
      notes: `Alta — ${plan.name}`,
      createdAt: startDate,
    });
    auditRows.push({
      tenantId,
      actorId: owner?.id ?? null,
      action: "MEMBERSHIP_ASSIGNED",
      targetType: "Membership",
      targetId: membershipId,
      metadata: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        planName: plan.name,
        amount: Number(plan.price),
      },
      createdAt: startDate,
    });
  }

  // 4.4 PAUSED (5) — pausados por viaje, lesión, etc.
  const pauseReasons = [
    "Viaje al extranjero",
    "Lesión en hombro — recuperación",
    "Embarazo",
    "Mudanza temporal",
    "Vacaciones de fin de año",
  ];
  const pausedTargets = [
    ...pausedAthletes,
    ...activeAthletes.slice(36, 40),
  ].slice(0, 5);
  for (let i = 0; i < pausedTargets.length; i++) {
    const athlete = pausedTargets[i];
    const startDate = daysAgo(60 + Math.floor(Math.random() * 90), 10);
    const endDate = daysFromNow(30, 23);
    const membershipId = `seed-mem-${athlete.id}-paused`;
    const pausedAt = daysAgo(7 + Math.floor(Math.random() * 50), 14);
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: planUnlimited.id,
      startDate,
      endDate,
      status: "PAUSED",
      autoRenew: false,
      createdAt: startDate,
    });
    auditRows.push({
      tenantId,
      actorId: owner?.id ?? null,
      action: "MEMBERSHIP_PAUSED",
      targetType: "Membership",
      targetId: membershipId,
      metadata: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        reason: pauseReasons[i],
      },
      createdAt: pausedAt,
    });
  }

  // 4.5 CANCELLED (4) — bajas con razón
  const cancelReasons = [
    "Cambio de gimnasio",
    "Mudanza fuera de la ciudad",
    "Razones económicas",
    "Falta de tiempo",
  ];
  const cancelledTargets = activeAthletes.slice(40, 44);
  for (let i = 0; i < cancelledTargets.length; i++) {
    const athlete = cancelledTargets[i];
    const startDate = daysAgo(120 + Math.floor(Math.random() * 200), 10);
    const cancelledAt = daysAgo(3 + Math.floor(Math.random() * 28), 16);
    const membershipId = `seed-mem-${athlete.id}-cancelled`;
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: planMonthly.id,
      startDate,
      endDate: cancelledAt,
      status: "CANCELLED",
      autoRenew: false,
      createdAt: startDate,
    });
    paymentsForMembership({
      membershipId,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      plan: {
        id: planMonthly.id,
        name: planMonthly.name,
        price: Number(planMonthly.price),
        durationDays: 30,
      },
      startDate,
      endDate: cancelledAt,
      monthsHistorical: 3,
    });
    auditRows.push({
      tenantId,
      actorId: owner?.id ?? null,
      action: "MEMBERSHIP_CANCELLED",
      targetType: "Membership",
      targetId: membershipId,
      metadata: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        reason: cancelReasons[i],
      },
      createdAt: cancelledAt,
    });
  }

  // 4.6 EXPIRED morosos (3) — membresías que expiraron sin renovar
  const expiredTargets = activeAthletes.slice(44, 47);
  for (let i = 0; i < expiredTargets.length; i++) {
    const athlete = expiredTargets[i];
    const startDate = daysAgo(60 + Math.floor(Math.random() * 30), 10);
    const endDate = daysAgo(7 + Math.floor(Math.random() * 23), 23); // vencido 7-30d atrás
    const membershipId = `seed-mem-${athlete.id}-expired`;
    membershipRows.push({
      id: membershipId,
      tenantId,
      athleteId: athlete.id,
      planId: planMonthly.id,
      startDate,
      endDate,
      status: "EXPIRED",
      autoRenew: false,
      createdAt: startDate,
    });
    paymentsForMembership({
      membershipId,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      plan: {
        id: planMonthly.id,
        name: planMonthly.name,
        price: Number(planMonthly.price),
        durationDays: 30,
      },
      startDate,
      endDate,
      monthsHistorical: 2,
    });
    // Pago PENDING (renovación esperada que no llegó)
    paymentRows.push({
      tenantId,
      membershipId,
      amount: Number(planMonthly.price),
      currency: "MXN",
      gateway: "MERCADOPAGO",
      status: "PENDING",
      notes: `Renovación pendiente — ${planMonthly.name}`,
      createdAt: new Date(endDate.getTime() - 3 * 86400000),
    });
  }

  // 4.7 Drop-in (3) — visitantes ocasionales con 1-2 pagos
  const dropinTargets = [
    ...dropinAthletes,
    ...activeAthletes.slice(47, 49),
  ].slice(0, 3);
  for (let i = 0; i < dropinTargets.length; i++) {
    const athlete = dropinTargets[i];
    for (let j = 0; j < 1 + Math.floor(Math.random() * 2); j++) {
      const startDate = daysAgo(15 + j * 20, 10);
      const membershipId = `seed-mem-${athlete.id}-dropin-${j}`;
      membershipRows.push({
        id: membershipId,
        tenantId,
        athleteId: athlete.id,
        planId: planDropin.id,
        startDate,
        endDate: new Date(startDate.getTime() + 86400000),
        status: "EXPIRED",
        autoRenew: false,
        createdAt: startDate,
      });
      paymentRows.push({
        tenantId,
        membershipId,
        amount: Number(planDropin.price),
        currency: "MXN",
        gateway: "CASH",
        status: "PAID",
        paidAt: startDate,
        notes: "Drop-in",
        createdAt: startDate,
      });
    }
  }

  await prisma.membership.createMany({ data: membershipRows });
  await prisma.payment.createMany({ data: paymentRows });
  console.log(
    `→ ${membershipRows.length} memberships (ACTIVE/PAUSED/CANCELLED/EXPIRED), ${paymentRows.length} payments`,
  );

  // 5. Pagos del MES ACTUAL — mix PAID/PENDING/FAILED
  const currentMonthPayments: Prisma.PaymentCreateManyInput[] = [];
  const activeMems = membershipRows.filter((m) => m.status === "ACTIVE");
  for (let i = 0; i < activeMems.length; i++) {
    const m = activeMems[i];
    const plan = plans.find((p) => p.id === m.planId)!;
    // 70% PAID · 20% PENDING · 10% FAILED
    const isPaid = i % 10 < 7;
    const isPending = !isPaid && i % 10 < 9;
    const day = 1 + (i % 27);
    const createdAt = (() => {
      const d = new Date();
      d.setDate(day);
      d.setHours(10 + (i % 8), 0, 0, 0);
      return d;
    })();
    currentMonthPayments.push({
      tenantId,
      membershipId: m.id!,
      amount: Number(plan.price),
      currency: "MXN",
      gateway: pickRandom(["MERCADOPAGO", "STRIPE", "CASH"] as const),
      status: isPaid ? "PAID" : isPending ? "PENDING" : "FAILED",
      paidAt: isPaid ? createdAt : null,
      notes: `Mensualidad mes actual`,
      createdAt,
    });
    if (isPaid) {
      auditRows.push({
        tenantId,
        actorId: owner?.id ?? null,
        action: "PAYMENT_REGISTERED",
        targetType: "Payment",
        targetId: `seed-curmonth-${m.id}`,
        metadata: { amount: Number(plan.price) },
        createdAt,
      });
    }
  }
  await prisma.payment.createMany({ data: currentMonthPayments });
  console.log(
    `→ ${currentMonthPayments.length} pagos mes actual (mix PAID/PENDING/FAILED)`,
  );

  // 6. Announcements
  const announcementsData: Prisma.AnnouncementCreateManyInput[] = [
    {
      tenantId,
      title: "Bienvenidos a Mayo",
      body: "Este mes traemos un mes de PR challenges. Inscríbete antes del 10 de mayo en recepción. Premios para top 3 hombres y top 3 mujeres en cada categoría.",
      audience: "ACTIVE",
      channel: "IN_APP",
      status: "SENT",
      sentAt: daysAgo(30, 10),
      recipientCount: 38,
      authorId: owner?.id ?? null,
      createdAt: daysAgo(31, 10),
    },
    {
      tenantId,
      title: "Cambio de horario clase 7pm",
      body: "A partir del lunes próximo la clase de 19:00 se mueve a las 19:30 para ajustar el flujo de gente. Disculpen las molestias.",
      audience: "ACTIVE",
      channel: "IN_APP",
      status: "SENT",
      sentAt: daysAgo(7, 9),
      recipientCount: 42,
      authorId: owner?.id ?? null,
      createdAt: daysAgo(8, 18),
    },
    {
      tenantId,
      title: "Mantenimiento — Cerrado domingo",
      body: "Este domingo cerramos por mantenimiento del piso. Volvemos lunes con todo nuevo.",
      audience: "ALL",
      channel: "IN_APP",
      status: "SENT",
      sentAt: daysAgo(3, 14),
      recipientCount: 49,
      authorId: owner?.id ?? null,
      createdAt: daysAgo(4, 10),
    },
    {
      tenantId,
      title: "Open Box CrossFit Mayo",
      body: "Inscripciones abiertas para nuestro Open interno. 4 fines de semana, 4 WODs, premios increíbles. Inscríbete con tu coach.",
      audience: "ACTIVE",
      channel: "IN_APP",
      status: "SCHEDULED",
      scheduledAt: daysFromNow(2, 9),
      recipientCount: 0,
      authorId: owner?.id ?? null,
      createdAt: daysAgo(1, 16),
    },
    {
      tenantId,
      title: "Nuevo plan anual",
      body: "Lanzamos plan anual con descuento del 20%. Pregunta en recepción.",
      audience: "ALL",
      channel: "IN_APP",
      status: "DRAFT",
      recipientCount: 0,
      authorId: owner?.id ?? null,
      createdAt: daysAgo(0, 11),
    },
  ];
  await prisma.announcement.createMany({ data: announcementsData });
  console.log(
    `→ ${announcementsData.length} announcements (3 SENT + 1 SCHEDULED + 1 DRAFT)`,
  );

  // 7. Audit events recientes — mezclar tipos para feed live
  const recentBookings = await prisma.booking.findMany({
    where: { tenantId, status: "ATTENDED" },
    orderBy: { checkedInAt: "desc" },
    take: 15,
    select: { id: true, athleteId: true, classId: true, checkedInAt: true },
  });
  const recentScores = await prisma.score.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, athleteId: true, createdAt: true },
  });
  const athletesById = new Map(athletes.map((a) => [a.id, a]));

  for (const b of recentBookings) {
    const a = athletesById.get(b.athleteId);
    if (!a || !b.checkedInAt) continue;
    auditRows.push({
      tenantId,
      actorId: coach?.id ?? null,
      action: "BOOKING_CHECKIN",
      targetType: "Booking",
      targetId: b.id,
      metadata: { athleteName: `${a.firstName} ${a.lastName}` },
      createdAt: b.checkedInAt,
    });
  }
  for (const s of recentScores) {
    const a = athletesById.get(s.athleteId);
    if (!a) continue;
    auditRows.push({
      tenantId,
      actorId: coach?.id ?? null,
      action: "SCORE_SUBMITTED",
      targetType: "Score",
      targetId: s.id,
      metadata: { athleteName: `${a.firstName} ${a.lastName}` },
      createdAt: s.createdAt,
    });
  }
  await prisma.auditEvent.createMany({ data: auditRows });
  console.log(`→ ${auditRows.length} audit events`);

  // 8. Asegurar que el atleta protagonista (atleta@iron-hands.demo) tenga membership ACTIVE
  // Si seed-athlete-story corre después, esto ya está garantizado.
  // Pero por si acaso: si no tiene membership, crear una activa.
  const protaUser = await prisma.user.findUnique({
    where: { email: "atleta@iron-hands.demo" },
    select: { id: true },
  });
  if (protaUser) {
    const protaAthlete = await prisma.athlete.findUnique({
      where: { userId: protaUser.id },
      select: { id: true },
    });
    if (protaAthlete) {
      const existingMem = await prisma.membership.findFirst({
        where: { athleteId: protaAthlete.id, status: "ACTIVE" },
      });
      if (!existingMem) {
        const startDate = daysAgo(120, 9);
        const endDate = daysFromNow(20, 23);
        const memId = `seed-mem-${protaAthlete.id}-prota`;
        await prisma.membership.create({
          data: {
            id: memId,
            tenantId,
            athleteId: protaAthlete.id,
            planId: planUnlimited.id,
            startDate,
            endDate,
            status: "ACTIVE",
            autoRenew: true,
            createdAt: startDate,
          },
        });
        // 4 pagos históricos
        for (let i = 4; i >= 1; i--) {
          await prisma.payment.create({
            data: {
              tenantId,
              membershipId: memId,
              amount: Number(planUnlimited.price),
              currency: "MXN",
              gateway: i === 1 ? "STRIPE" : "MERCADOPAGO",
              status: "PAID",
              paidAt: daysAgo(i * 30, 10),
              notes: `Mensualidad ${planUnlimited.name}`,
              createdAt: daysAgo(i * 30, 10),
            },
          });
        }
        console.log(`→ Membership protagonista creada (${planUnlimited.name})`);
      }
    }
  }

  // 9. Atletas en riesgo: 3 ACTIVE que dejaron de venir hace +14d (ghosting)
  // Borrar sus bookings ATTENDED de los últimos 20 días para que aparezcan en
  // /admin/atletas → "EN RIESGO" y churn risk list.
  const ghostingTargets = activeAthletes.slice(20, 23);
  const cutoff20 = daysAgo(20, 0);
  for (const a of ghostingTargets) {
    await prisma.booking.deleteMany({
      where: {
        tenantId,
        athleteId: a.id,
        status: "ATTENDED",
        checkedInAt: { gte: cutoff20 },
      },
    });
    // Audit event opcional: queda como histórico de "última visita"
  }
  console.log(
    `→ ${ghostingTargets.length} atletas marcados en riesgo (sin asistencia >20d)`,
  );

  // Resumen
  const counts = await Promise.all([
    prisma.membership.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.membership.count({ where: { tenantId, status: "PAUSED" } }),
    prisma.membership.count({ where: { tenantId, status: "CANCELLED" } }),
    prisma.membership.count({ where: { tenantId, status: "EXPIRED" } }),
    prisma.payment.count({ where: { tenantId, status: "PAID" } }),
    prisma.payment.count({ where: { tenantId, status: "PENDING" } }),
    prisma.payment.count({ where: { tenantId, status: "FAILED" } }),
    prisma.payment.aggregate({
      where: { tenantId, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  console.log(`
✅ Operación del box sembrada:
   Memberships:  ${counts[0]} ACTIVE · ${counts[1]} PAUSED · ${counts[2]} CANCELLED · ${counts[3]} EXPIRED
   Payments:     ${counts[4]} PAID · ${counts[5]} PENDING · ${counts[6]} FAILED
   Revenue total PAID: $${counts[7]._sum.amount?.toString() ?? 0} MXN
   Announcements: ${announcementsData.length} (3 SENT + 1 SCHEDULED + 1 DRAFT)
   Audit events:  ${auditRows.length} (altas, pagos, check-ins, scores)
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
