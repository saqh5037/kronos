"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as rawDb, withTenant } from "../db";

async function requireCoachSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Forbidden — COACH/OWNER/STAFF only");
  }
  return session;
}

async function requireOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden — OWNER only");
  return session;
}

export type AliasRow = {
  id: string;
  alias: string;
  athleteId: string;
  athleteName: string;
  createdAt: Date;
};

export async function listAliasesForTenant(): Promise<AliasRow[]> {
  const session = await requireCoachSession();
  const db = withTenant(session.user.tenantId);

  const aliases = await db.athleteAlias.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      athlete: { select: { firstName: true, lastName: true } },
    },
  });

  return aliases.map((a) => ({
    id: a.id,
    alias: a.alias,
    athleteId: a.athleteId,
    athleteName: `${a.athlete.firstName} ${a.athlete.lastName}`,
    createdAt: a.createdAt,
  }));
}

/**
 * Add an alias for an athlete. Upsert: if alias already exists for the tenant,
 * updates the athleteId (re-mapping the alias). Never throws on duplicate.
 */
export async function addAlias(
  athleteId: string,
  alias: string,
): Promise<{ ok: boolean }> {
  const session = await requireCoachSession();
  const tenantId = session.user.tenantId;

  // Verify athlete belongs to tenant
  const db = withTenant(tenantId);
  const athlete = await db.athlete.findUnique({ where: { id: athleteId } });
  if (!athlete) throw new Error("Atleta no encontrado");

  const normalized = alias.trim();
  if (!normalized) throw new Error("El apodo no puede estar vacío");

  await rawDb.athleteAlias.upsert({
    where: { tenantId_alias: { tenantId, alias: normalized } },
    update: { athleteId, createdById: session.user.id },
    create: {
      tenantId,
      athleteId,
      alias: normalized,
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/ajustes/apodos");
  return { ok: true };
}

export async function removeAlias(aliasId: string): Promise<{ ok: boolean }> {
  const session = await requireOwnerSession();

  const alias = await rawDb.athleteAlias.findFirst({
    where: { id: aliasId, tenantId: session.user.tenantId },
  });
  if (!alias) throw new Error("Apodo no encontrado");

  await rawDb.athleteAlias.delete({ where: { id: aliasId } });
  revalidatePath("/admin/ajustes/apodos");
  return { ok: true };
}

/**
 * Returns a dict: alias → athleteId, used by the OCR module for fuzzy match.
 */
export async function getAliasDict(
  tenantId: string,
): Promise<Record<string, string>> {
  const aliases = await rawDb.athleteAlias.findMany({
    where: { tenantId },
    select: { alias: true, athleteId: true },
  });
  const dict: Record<string, string> = {};
  for (const a of aliases) {
    dict[a.alias.toLowerCase()] = a.athleteId;
  }
  return dict;
}
