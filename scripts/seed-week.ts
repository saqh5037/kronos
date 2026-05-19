/**
 * Seed week — Pobla el último box creado con una semana completa de actividad.
 *
 * Flujo:
 *  1. Resuelve el box target (último completado, o --box-slug)
 *  2. Invita N atletas ficticios (default 5) — DB-only o mail.tm real
 *  3. Acepta cada invitación (replica la lógica de acceptInvitation con Prisma directo)
 *  4. Crea 28 clases para la semana próxima (5 WOD/día Lun-Vie + 3 OPEN_BOX Sábado)
 *  5. Distribuye reservas (4 por atleta, mix de días)
 *
 * Uso:
 *   pnpm tsx scripts/seed-week.ts [opciones]
 *
 * Opciones:
 *   --box-slug <slug>     Override del box target (default: último con onboarding completo)
 *   --athletes <n>        Número de atletas (default: 5)
 *   --real-email          Usa mail.tm para emails reales (requiere RESEND_API_KEY)
 *   --skip-bookings       No crea reservas
 *   --small-capacity      Capacidad 3 por clase para forzar WAITLIST (default: 12)
 *   --dry-run             Imprime el plan sin tocar BD
 *   --reset               Borra atletas/clases/reservas del seed previo y aborta
 */

import { ClassKind } from "@prisma/client";
import { db } from "../src/server/db";
import { sendEmail } from "../src/lib/email";
import { buildInvitationToken } from "../src/server/invitation-token";
import {
  pickAthleteFixtures,
  getNextMondayUtc,
  buildClassStartsAt,
  WOD_HOURS_LOCAL,
  OPEN_BOX_HOURS_LOCAL,
  SEED_EMAIL_PREFIX,
  SEED_EMAIL_DOMAIN_LOCAL,
  createMailTmInbox,
  waitForInvitationToken,
  log,
  type AthleteFixture,
  type MailTmInbox,
} from "./_seed-week-helpers";

// ─── Args ──────────────────────────────────────────────────────────────────────

type Args = {
  boxSlug: string | null;
  athletes: number;
  realEmail: boolean;
  skipBookings: boolean;
  smallCapacity: boolean;
  dryRun: boolean;
  reset: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    boxSlug: null,
    athletes: 5,
    realEmail: false,
    skipBookings: false,
    smallCapacity: false,
    dryRun: false,
    reset: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--box-slug") out.boxSlug = argv[++i] ?? null;
    else if (a === "--athletes") out.athletes = Number(argv[++i] ?? 5);
    else if (a === "--real-email") out.realEmail = true;
    else if (a === "--skip-bookings") out.skipBookings = true;
    else if (a === "--small-capacity") out.smallCapacity = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--reset") out.reset = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "pnpm tsx scripts/seed-week.ts [--box-slug=foo] [--athletes=5] [--real-email] [--skip-bookings] [--small-capacity] [--dry-run] [--reset]",
      );
      process.exit(0);
    } else throw new Error(`Unknown arg: ${a}`);
  }
  if (!Number.isFinite(out.athletes) || out.athletes < 1 || out.athletes > 50) {
    throw new Error("--athletes must be between 1 and 50");
  }
  return out;
}

// ─── Box resolution ────────────────────────────────────────────────────────────

async function resolveTargetBox(slug: string | null) {
  if (slug) {
    const box = await db.box.findUnique({ where: { slug } });
    if (!box) throw new Error(`Box con slug '${slug}' no encontrado`);
    return box;
  }
  const box = await db.box.findFirst({
    where: {
      onboardingCompletedAt: { not: null },
      users: { some: { role: "OWNER" } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!box) {
    throw new Error(
      "No hay box con onboarding completado + OWNER. Crea uno via /admin/onboarding o pasa --box-slug",
    );
  }
  return box;
}

async function findOwner(tenantId: string) {
  const owner = await db.user.findFirst({
    where: { tenantId, role: "OWNER" },
  });
  if (!owner) throw new Error(`Box ${tenantId} sin OWNER — estado inválido`);
  return owner;
}

// ─── Reset ─────────────────────────────────────────────────────────────────────

async function resetSeedData(tenantId: string) {
  const seedInvites = await db.athleteInvitation.findMany({
    where: {
      tenantId,
      email: { startsWith: SEED_EMAIL_PREFIX },
    },
    select: { id: true, email: true },
  });
  const seedEmails = seedInvites.map((i) => i.email);

  const users = await db.user.findMany({
    where: { tenantId, email: { in: seedEmails } },
    select: { id: true, athlete: { select: { id: true } } },
  });
  const athleteIds = users
    .map((u) => u.athlete?.id)
    .filter((x): x is string => !!x);
  const userIds = users.map((u) => u.id);

  // Bookings de esos atletas
  await db.booking.deleteMany({ where: { athleteId: { in: athleteIds } } });
  // Atletas
  await db.athlete.deleteMany({ where: { id: { in: athleteIds } } });
  // Users
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  // Invitations
  await db.athleteInvitation.deleteMany({
    where: { id: { in: seedInvites.map((i) => i.id) } },
  });

  // Clases creadas por el script — heurística: clases con recurrenceRule null
  // creadas en los últimos 7 días para este tenant, sin bookings asociados.
  // Mejor: identificar por marker en wodId/coachId, pero como no lo guardamos,
  // borramos todas las del seed window (próxima semana).
  const nextMonday = getNextMondayUtc("America/Mexico_City");
  const weekEnd = new Date(nextMonday);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const deletedClasses = await db.class.deleteMany({
    where: {
      tenantId,
      startsAt: { gte: nextMonday, lt: weekEnd },
      // Solo las creadas en últimas 24h (probabilidad alta de ser del seed)
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  log.ok(
    `Reset: ${seedInvites.length} invitaciones, ${athleteIds.length} atletas, ${userIds.length} users, ${deletedClasses.count} clases`,
  );
}

// ─── Invitations ───────────────────────────────────────────────────────────────

type Invited = {
  fixture: AthleteFixture;
  email: string;
  token: string;
  inbox: MailTmInbox | null;
};

async function ensureNoCollisions(tenantId: string, athletesCount: number) {
  const existing = await db.athleteInvitation.count({
    where: { tenantId, email: { startsWith: SEED_EMAIL_PREFIX } },
  });
  if (existing > 0) {
    throw new Error(
      `Ya existen ${existing} invitaciones seed previas para este box. Corre con --reset para limpiar antes.`,
    );
  }
  // Best effort: emails únicos por timestamp; aún así verificar.
  if (athletesCount > 50)
    throw new Error("Demasiados atletas (máx 50 por corrida)");
}

function inviteEmailHtml(boxName: string, firstName: string, link: string) {
  return `<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">Hola ${firstName},</h1>
    <p style="font-size: 16px; line-height: 1.5;">${boxName} te invitó a su comunidad en <strong>Kronos</strong>.</p>
    <p style="margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: #c8ff2d; color: #08080a; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">Aceptar invitación</a>
    </p>
    <p style="font-size: 13px; color: #aaa;">O copia este link: <a href="${link}" style="color: #c8ff2d;">${link}</a></p>
  </div>
</body></html>`;
}

async function inviteAthletes(
  tenantId: string,
  boxName: string,
  ownerId: string,
  fixtures: AthleteFixture[],
  realEmail: boolean,
  dryRun: boolean,
): Promise<Invited[]> {
  const ts = Date.now();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const out: Invited[] = [];

  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i]!;
    let email: string;
    let inbox: MailTmInbox | null = null;

    if (realEmail) {
      inbox = await createMailTmInbox(`${ts}-${i}`);
      email = inbox.address;
    } else {
      email = `${SEED_EMAIL_PREFIX}${ts}-${i + 1}@${SEED_EMAIL_DOMAIN_LOCAL}`;
    }

    const token = buildInvitationToken();

    if (dryRun) {
      log.info(
        `[DRY] invite #${i + 1}: ${fx.firstName} ${fx.lastName} → ${email}`,
      );
      out.push({ fixture: fx, email, token, inbox });
      continue;
    }

    await db.athleteInvitation.create({
      data: {
        tenantId,
        email,
        firstName: fx.firstName,
        lastName: fx.lastName,
        phone: fx.phone,
        token,
        expiresAt,
        createdById: ownerId,
      },
    });

    if (realEmail) {
      const link = `${baseUrl}/invitacion/${token}`;
      const result = await sendEmail({
        to: [email],
        subject: `Te invitamos a ${boxName} en Kronos`,
        html: inviteEmailHtml(boxName, fx.firstName, link),
      });
      if (!result.ok) {
        throw new Error(`sendEmail falló para ${email}: ${result.error}`);
      }
    }

    log.ok(`Invitación #${i + 1}: ${fx.firstName} ${fx.lastName} → ${email}`);
    out.push({ fixture: fx, email, token, inbox });
  }
  return out;
}

// ─── Accept invitations ────────────────────────────────────────────────────────

async function acceptInvitation(tenantId: string, invited: Invited) {
  // Replica la lógica de acceptInvitation() (src/server/actions/athlete-invitations.ts:233)
  // pero sin getServerSession ni revalidatePath (no aplica desde script Node).
  return db.$transaction(async (tx) => {
    const inv = await tx.athleteInvitation.findUnique({
      where: { token: invited.token },
    });
    if (!inv) throw new Error(`Invitation token not found: ${invited.token}`);
    if (inv.acceptedAt) return { skipped: true, athleteId: null };

    let user = await tx.user.findUnique({
      where: { email: inv.email },
      select: { id: true, tenantId: true },
    });
    if (user && user.tenantId !== tenantId) {
      throw new Error(`Email ${inv.email} registrado en otro box`);
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: inv.email,
          name: invited.fixture.lastName
            ? `${invited.fixture.firstName} ${invited.fixture.lastName}`
            : invited.fixture.firstName,
          role: "ATHLETE",
          tenantId,
        },
        select: { id: true, tenantId: true },
      });
    }

    let athlete = await tx.athlete.findFirst({
      where: { tenantId, userId: user.id },
      select: { id: true },
    });
    if (!athlete) {
      athlete = await tx.athlete.create({
        data: {
          tenantId,
          userId: user.id,
          firstName: invited.fixture.firstName,
          lastName: invited.fixture.lastName,
          phone: invited.fixture.phone,
        },
        select: { id: true },
      });
    }

    await tx.athleteInvitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });

    return { skipped: false, athleteId: athlete.id };
  });
}

async function acceptAllInvitations(
  tenantId: string,
  invited: Invited[],
  realEmail: boolean,
  dryRun: boolean,
) {
  const results: {
    athleteId: string;
    fixture: AthleteFixture;
    email: string;
  }[] = [];
  for (let i = 0; i < invited.length; i++) {
    const inv = invited[i]!;
    let token = inv.token;

    if (realEmail && inv.inbox) {
      log.info(`Esperando email en ${inv.inbox.address} (timeout 60s)...`);
      try {
        token = await waitForInvitationToken(inv.inbox, 60_000);
      } catch (e) {
        log.warn(
          `mail.tm no recibió email — usando token de DB (Resend tarda o no cableado): ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    if (dryRun) {
      log.info(`[DRY] accept invitation token=${token.slice(0, 8)}…`);
      results.push({
        athleteId: `dry-${i}`,
        fixture: inv.fixture,
        email: inv.email,
      });
      continue;
    }

    const r = await acceptInvitation(tenantId, { ...inv, token });
    if (r.skipped) {
      log.warn(`Ya aceptada previamente: ${inv.email}`);
      continue;
    }
    log.ok(
      `Aceptada: ${inv.fixture.firstName} ${inv.fixture.lastName} (athleteId=${r.athleteId!.slice(0, 8)}…)`,
    );
    results.push({
      athleteId: r.athleteId!,
      fixture: inv.fixture,
      email: inv.email,
    });
  }
  return results;
}

// ─── Classes ───────────────────────────────────────────────────────────────────

async function createWeekClasses(
  tenantId: string,
  ownerId: string,
  timezone: string,
  capacity: number,
  dryRun: boolean,
) {
  const monday = getNextMondayUtc(timezone);
  type Row = {
    tenantId: string;
    startsAt: Date;
    durationMin: number;
    capacity: number;
    kind: ClassKind;
    coachId: string;
  };
  const rows: Row[] = [];

  // Lun (0) - Vie (4): 5 clases WOD
  for (let day = 0; day < 5; day++) {
    for (const hour of WOD_HOURS_LOCAL) {
      rows.push({
        tenantId,
        startsAt: buildClassStartsAt(monday, day, hour, timezone),
        durationMin: 60,
        capacity,
        kind: ClassKind.WOD,
        coachId: ownerId,
      });
    }
  }
  // Sábado (5): 3 OPEN_BOX
  for (const hour of OPEN_BOX_HOURS_LOCAL) {
    rows.push({
      tenantId,
      startsAt: buildClassStartsAt(monday, 5, hour, timezone),
      durationMin: 60,
      capacity,
      kind: ClassKind.OPEN_BOX,
      coachId: ownerId,
    });
  }
  // Domingo (6): cerrado, sin clases

  if (dryRun) {
    log.info(
      `[DRY] crear ${rows.length} clases (${rows.length - 3} WOD + 3 OPEN_BOX)`,
    );
    for (const r of rows.slice(0, 3)) {
      log.info(`  · ${r.startsAt.toISOString()} ${r.kind} cap=${r.capacity}`);
    }
    log.info(`  · ... (+${rows.length - 3} más)`);
    return rows.map((_, i) => `dry-class-${i}`);
  }

  const created = await db.class.createMany({ data: rows });
  log.ok(`${created.count} clases creadas (lun-vie WOD + sáb OPEN_BOX)`);

  // Recuperar IDs en orden por startsAt — necesarios para las reservas
  const all = await db.class.findMany({
    where: {
      tenantId,
      startsAt: {
        gte: rows[0]!.startsAt,
        lte: rows[rows.length - 1]!.startsAt,
      },
    },
    select: { id: true, startsAt: true, kind: true },
    orderBy: { startsAt: "asc" },
  });
  return all.map((c) => c.id);
}

// ─── Bookings ──────────────────────────────────────────────────────────────────

async function distributeBookings(
  tenantId: string,
  athletes: { athleteId: string; fixture: AthleteFixture }[],
  classIds: string[],
  smallCapacity: boolean,
  dryRun: boolean,
) {
  const BOOKINGS_PER_ATHLETE = 4;
  let bookedCount = 0;
  let waitlistCount = 0;

  for (const ath of athletes) {
    // Fisher-Yates shuffle determinístico con seed del athleteId
    const picks = shuffledIndices(ath.athleteId, classIds.length).slice(
      0,
      BOOKINGS_PER_ATHLETE,
    );

    for (const idx of picks) {
      const classId = classIds[idx]!;
      if (dryRun) {
        log.info(`[DRY] booking: ${ath.fixture.firstName} → class[${idx}]`);
        bookedCount++;
        continue;
      }
      // Count existing BOOKED para decidir WAITLIST si --small-capacity
      const existing = await db.booking.count({
        where: { classId, status: "BOOKED" },
      });
      const capLimit = smallCapacity ? 3 : 12;
      const status = existing >= capLimit ? "WAITLIST" : "BOOKED";
      if (status === "BOOKED") bookedCount++;
      else waitlistCount++;

      await db.booking.upsert({
        where: {
          classId_athleteId: { classId, athleteId: ath.athleteId },
        },
        update: { status },
        create: {
          tenantId,
          classId,
          athleteId: ath.athleteId,
          status,
        },
      });
    }
  }

  log.ok(
    `Reservas: ${bookedCount} BOOKED, ${waitlistCount} WAITLIST (total ${bookedCount + waitlistCount})`,
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function shuffledIndices(seed: string, count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  let s = hashStr(seed) >>> 0 || 1;
  for (let i = indices.length - 1; i > 0; i--) {
    // LCG (Numerical Recipes): predecible pero bien distribuido
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  log.info(
    `seed-week — athletes=${args.athletes} realEmail=${args.realEmail} smallCapacity=${args.smallCapacity} dryRun=${args.dryRun} reset=${args.reset}`,
  );

  if (args.realEmail && !process.env.RESEND_API_KEY) {
    throw new Error(
      "--real-email requiere RESEND_API_KEY cableada (los emails no saldrán de verdad sin ella)",
    );
  }

  log.step(1, 6, "Resolver box target");
  const box = await resolveTargetBox(args.boxSlug);
  log.ok(`Box: ${box.name} (slug=${box.slug}, tz=${box.timezone})`);
  log.ok(`  ID: ${box.id}`);
  log.ok(
    `  Onboarding completado: ${box.onboardingCompletedAt?.toISOString() ?? "NO"}`,
  );

  const owner = await findOwner(box.id);
  log.ok(`Owner: ${owner.name ?? "(sin nombre)"} (${owner.email})`);

  if (args.reset) {
    log.step(2, 6, "Reset (borrar seed previo)");
    await resetSeedData(box.id);
    log.ok("Reset completado. Saliendo.");
    await db.$disconnect();
    return;
  }

  log.step(2, 6, "Validar que no haya colisión con seed previo");
  if (!args.dryRun) {
    await ensureNoCollisions(box.id, args.athletes);
  }

  log.step(3, 6, "Invitar atletas");
  const fixtures = pickAthleteFixtures(args.athletes);
  const invited = await inviteAthletes(
    box.id,
    box.name,
    owner.id,
    fixtures,
    args.realEmail,
    args.dryRun,
  );

  log.step(4, 6, "Aceptar invitaciones");
  const athletes = await acceptAllInvitations(
    box.id,
    invited,
    args.realEmail,
    args.dryRun,
  );

  log.step(5, 6, "Crear clases de la semana");
  const capacity = args.smallCapacity ? 3 : 12;
  const classIds = await createWeekClasses(
    box.id,
    owner.id,
    box.timezone,
    capacity,
    args.dryRun,
  );

  if (args.skipBookings) {
    log.warn("--skip-bookings: no se crean reservas");
  } else {
    log.step(6, 6, "Distribuir reservas");
    await distributeBookings(
      box.id,
      athletes,
      classIds,
      args.smallCapacity,
      args.dryRun,
    );
  }

  log.ok("\n✓ seed-week completado");
  log.info(`  Box: ${box.name} (${box.slug})`);
  log.info(`  Atletas: ${athletes.length}`);
  log.info(`  Clases: ${classIds.length}`);
  if (args.realEmail) {
    log.info(`  Inboxes mail.tm:`);
    for (const inv of invited) {
      if (inv.inbox) log.info(`    · ${inv.inbox.address}`);
    }
  }
  log.info(`\nUrls útiles:`);
  log.info(`  /admin/dashboard`);
  log.info(`  /admin/atletas`);
  log.info(`  /admin/programacion`);
  log.info(`  /admin/reservas`);

  await db.$disconnect();
}

main().catch(async (e) => {
  log.err(e instanceof Error ? e.message : String(e));
  if (e instanceof Error && e.stack) console.error(e.stack);
  await db.$disconnect();
  process.exit(1);
});
