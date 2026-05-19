"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { WearableProvider, WearableStatus } from "@prisma/client";
import { requireCachedSession } from "@/server/session";
import { withTenant } from "@/server/db";
import { logAudit } from "@/server/audit";
import { trackEvent } from "@/lib/analytics";
import { decryptToken } from "@/lib/crypto/token-vault";
import { revokeAccessToken } from "@/lib/wearables/whoop-client";

const providerSchema = z.enum(["WHOOP", "GARMIN", "APPLE_HEALTH", "OURA"]);

export type WearableSummary = {
  id: string;
  provider: WearableProvider;
  status: WearableStatus;
  scopes: string[];
  externalUserId: string;
  expiresAt: Date;
  lastSyncedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  createdAt: Date;
};

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export async function getMyWearableConnections(): Promise<WearableSummary[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const rows = await db.wearableConnection.findMany({
    where: { athleteId: me.id },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    status: r.status,
    scopes: r.scopes,
    externalUserId: r.externalUserId,
    expiresAt: r.expiresAt,
    lastSyncedAt: r.lastSyncedAt,
    lastErrorAt: r.lastErrorAt,
    lastErrorMessage: r.lastErrorMessage,
    createdAt: r.createdAt,
  }));
}

export async function disconnectWearable(
  providerInput: WearableProvider,
): Promise<{ ok: true }> {
  const provider = providerSchema.parse(providerInput);
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  const conn = await db.wearableConnection.findFirst({
    where: { athleteId: me.id, provider },
  });
  if (!conn) return { ok: true };

  if (provider === "WHOOP") {
    try {
      const accessToken = decryptToken(conn.accessToken);
      await revokeAccessToken(accessToken);
    } catch (err) {
      console.warn(
        "[wearables] revoke failed (continuing with local delete)",
        err,
      );
    }
  }

  await db.wearableConnection.delete({ where: { id: conn.id } });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "WEARABLE_DISCONNECTED",
    targetType: "WearableConnection",
    targetId: conn.id,
    metadata: { provider },
  });
  await trackEvent("wearable_disconnected", {
    tenantId,
    actorId: session.user.id,
    provider,
  });

  revalidatePath("/atleta/dispositivos");
  revalidatePath("/atleta");
  return { ok: true };
}

export async function toggleShareWithCoach(value: boolean): Promise<void> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  await db.athlete.update({
    where: { id: me.id },
    data: { shareWearableWithCoach: value },
  });
  revalidatePath("/atleta/dispositivos");
  revalidatePath("/atleta/ajustes");
}

export type SyncTrigger = {
  ok: boolean;
  message: string;
};

/**
 * Manual sync trigger. Implementación completa en Fase C (whoop-sync).
 * Por ahora marca lastSyncedAt como hint y devuelve mensaje placeholder.
 */
export async function triggerManualSync(
  providerInput: WearableProvider,
): Promise<SyncTrigger> {
  const provider = providerSchema.parse(providerInput);
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  const conn = await db.wearableConnection.findFirst({
    where: { athleteId: me.id, provider, status: "CONNECTED" },
  });
  if (!conn) {
    return { ok: false, message: "No hay conexión activa para sincronizar" };
  }

  return {
    ok: true,
    message: "Sincronización pendiente (Fase C). Conexión activa OK.",
  };
}
