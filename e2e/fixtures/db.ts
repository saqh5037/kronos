import { PrismaClient } from "@prisma/client";

let _client: PrismaClient | null = null;

export function db(): PrismaClient {
  if (!_client) _client = new PrismaClient();
  return _client;
}

export async function disconnect(): Promise<void> {
  if (_client) {
    await _client.$disconnect();
    _client = null;
  }
}

const SEED_BOX_SLUG = "iron-hands-polanco";

export async function getSeedBoxId(): Promise<string> {
  const box = await db().box.findUnique({
    where: { slug: SEED_BOX_SLUG },
    select: { id: true },
  });
  if (!box) {
    throw new Error(
      `Seed box ${SEED_BOX_SLUG} not found — did you run pnpm db:seed?`,
    );
  }
  return box.id;
}

export async function getDemoAthlete(): Promise<{
  id: string;
  userId: string;
  firstName: string;
}> {
  const user = await db().user.findUnique({
    where: { email: "atleta@iron-hands.demo" },
    include: { athlete: true },
  });
  if (!user?.athlete) {
    throw new Error("Demo athlete user not seeded");
  }
  return {
    id: user.athlete.id,
    userId: user.id,
    firstName: user.athlete.firstName,
  };
}

/**
 * Cancel ALL active bookings (BOOKED/WAITLIST) for the demo athlete so a
 * test starts with a known-clean count of 0. We don't filter by date —
 * tests assert `count({ status: BOOKED }) === 0`, so any past BOOKED
 * leftover from the seed would break the assertion.
 */
export async function clearFutureBookingsForDemoAthlete(): Promise<void> {
  const athlete = await getDemoAthlete();
  await db().booking.updateMany({
    where: {
      athleteId: athlete.id,
      status: { in: ["BOOKED", "WAITLIST"] },
    },
    data: { status: "CANCELLED" },
  });
}

/**
 * Find an upcoming class with available capacity (<capacity) starting ≥ now.
 * Returns the earliest one or throws.
 */
export async function findUpcomingClassWithCapacity(): Promise<{
  id: string;
  startsAt: Date;
  wodName: string | null;
}> {
  const tenantId = await getSeedBoxId();
  const classes = await db().class.findMany({
    where: {
      tenantId,
      startsAt: { gte: new Date() },
      isActive: true,
    },
    orderBy: { startsAt: "asc" },
    take: 30,
    include: {
      bookings: { select: { status: true } },
      wod: { select: { name: true } },
    },
  });

  for (const c of classes) {
    const occupied = c.bookings.filter(
      (b) => b.status === "BOOKED" || b.status === "ATTENDED",
    ).length;
    if (occupied < c.capacity) {
      return { id: c.id, startsAt: c.startsAt, wodName: c.wod?.name ?? null };
    }
  }
  throw new Error("No upcoming class with available capacity");
}

/**
 * Ensure today has a class scheduled with a STRENGTH/WEIGHT/single-movement
 * WOD (1RM-style) so PR detection can fire. If no such class exists today,
 * create one — and ensure the WOD itself exists.
 *
 * Returns the test target: classId + wodId + movementId (for PR cleanup).
 */
export async function ensureTodayStrengthClass(): Promise<{
  classId: string;
  wodId: string;
  movementId: string;
  wodName: string;
}> {
  const tenantId = await getSeedBoxId();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  // 1) Find any seeded 1RM WOD (1 movement, STRENGTH, WEIGHT)
  const wod = await db().wOD.findFirst({
    where: {
      tenantId,
      type: "STRENGTH",
      scoreType: "WEIGHT",
    },
    include: { movements: true },
  });

  if (!wod || wod.movements.length !== 1) {
    throw new Error(
      "No 1RM-style WOD seeded — cannot run STRENGTH PR test. Re-seed?",
    );
  }

  // 2) Reuse a previously-injected E2E class (00:01 today) if it exists,
  //    pointing to the same 1RM WOD. Cleanup happens between tests via
  //    clearScoresAndPR — we keep the class itself for idempotence.
  const existing = await db().class.findFirst({
    where: {
      tenantId,
      startsAt: { gte: start, lt: end },
      isActive: true,
      wodId: wod.id,
    },
    include: { wod: { include: { movements: true } } },
  });

  if (existing?.wod) {
    return {
      classId: existing.id,
      wodId: existing.wod.id,
      movementId: existing.wod.movements[0].movementId,
      wodName: existing.wod.name,
    };
  }

  // 3) Schedule a class for today at the very start of the day using the
  // seed coach. Earliest possible time guarantees this is the FIRST class
  // returned by getTodayWOD (orderBy startsAt asc), regardless of seed.
  const coach = await db().user.findUnique({
    where: { email: "coach@iron-hands.demo" },
  });
  if (!coach) throw new Error("Seed coach not found");

  const startsAt = new Date();
  startsAt.setHours(0, 1, 0, 0);

  const klass = await db().class.create({
    data: {
      tenantId,
      startsAt,
      durationMin: 60,
      capacity: 16,
      coachId: coach.id,
      wodId: wod.id,
      isActive: true,
    },
  });

  return {
    classId: klass.id,
    wodId: wod.id,
    movementId: wod.movements[0].movementId,
    wodName: wod.name,
  };
}

/**
 * Wipe all scores for the WOD and the PR for that movement so PR detection
 * fires fresh on the next submitScore call.
 */
export async function clearScoresAndPR(
  wodId: string,
  movementId: string,
): Promise<void> {
  const athlete = await getDemoAthlete();
  await db().score.deleteMany({
    where: { athleteId: athlete.id, wodId },
  });
  await db().pR.deleteMany({
    where: { athleteId: athlete.id, movementId },
  });
}
