import { PrismaClient } from "@prisma/client";

/**
 * Integration test setup — requires a running Postgres reachable via DATABASE_URL.
 * Tests skip gracefully when the DB is unreachable (CI without compose).
 */

let cachedClient: PrismaClient | null = null;
let dbAvailable: boolean | null = null;

export async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  if (!process.env.DATABASE_URL) {
    dbAvailable = false;
    return false;
  }
  try {
    const client = new PrismaClient({ log: [] });
    await client.$queryRawUnsafe("SELECT 1");
    await client.$disconnect();
    dbAvailable = true;
    return true;
  } catch {
    dbAvailable = false;
    return false;
  }
}

export function getTestClient(): PrismaClient {
  if (!cachedClient) {
    cachedClient = new PrismaClient({ log: [] });
  }
  return cachedClient;
}

export async function disconnectTestClient() {
  if (cachedClient) {
    await cachedClient.$disconnect();
    cachedClient = null;
  }
}

/**
 * Wipe all per-test data scoped to a given tenant. Caller is expected to
 * create their own tenant and seed the rows they need.
 */
export async function wipeTenant(client: PrismaClient, tenantId: string) {
  await client.$transaction([
    client.score.deleteMany({ where: { tenantId } }),
    client.pR.deleteMany({ where: { tenantId } }),
    client.booking.deleteMany({ where: { tenantId } }),
    client.streak.deleteMany({ where: { tenantId } }),
    client.class.deleteMany({ where: { tenantId } }),
    client.wODMovement.deleteMany({ where: { wod: { tenantId } } }),
    client.wOD.deleteMany({ where: { tenantId } }),
    client.movement.deleteMany({ where: { tenantId } }),
    client.athlete.deleteMany({ where: { tenantId } }),
    client.user.deleteMany({ where: { tenantId } }),
    client.box.deleteMany({ where: { id: tenantId } }),
  ]);
}

let counter = 0;
export function freshTenantId() {
  counter++;
  return `test-tenant-${Date.now()}-${counter}`;
}
