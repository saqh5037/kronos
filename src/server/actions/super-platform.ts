"use server";

import { db as prismaBase } from "@/server/db";
import { requireSuperAdmin } from "@/server/super-admin-guard";

export type PlatformBoxRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  subscriptionStatus: string;
  ownerEmail: string | null;
  athleteCount: number;
  userCount: number;
  createdAt: Date;
};

export type PlatformStats = {
  totalBoxes: number;
  totalAthletes: number;
  totalUsers: number;
  boxesByStatus: Record<string, number>;
  boxes: PlatformBoxRow[];
};

const EMPTY_STATS: PlatformStats = {
  totalBoxes: 0,
  totalAthletes: 0,
  totalUsers: 0,
  boxesByStatus: {},
  boxes: [],
};

/**
 * Métricas globales de plataforma (cross-tenant).
 *
 * Usa prismaBase directamente — es la excepción documentada para queries
 * que cruzan tenants. Ver src/server/db.ts:97-99.
 *
 * Retorna EMPTY_STATS si el caller no es super-admin — misma semántica
 * no-leak que listPilotBoxes (empty = no revela existencia de datos).
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return EMPTY_STATS;

  const [totalBoxes, totalAthletes, totalUsers, statusGroups, boxes] =
    await Promise.all([
      prismaBase.box.count(),
      prismaBase.athlete.count(),
      prismaBase.user.count(),
      prismaBase.box.groupBy({
        by: ["subscriptionStatus"],
        _count: { _all: true },
      }),
      prismaBase.box.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          country: true,
          subscriptionStatus: true,
          createdAt: true,
          users: {
            where: { role: "OWNER" },
            select: { email: true },
            take: 1,
          },
          _count: {
            select: {
              athletes: true,
              users: true,
            },
          },
        },
      }),
    ]);

  const boxesByStatus = statusGroups.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.subscriptionStatus] = row._count._all;
      return acc;
    },
    {},
  );

  const mappedBoxes: PlatformBoxRow[] = boxes.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    city: b.city,
    country: b.country,
    subscriptionStatus: b.subscriptionStatus,
    ownerEmail: b.users[0]?.email ?? null,
    athleteCount: b._count.athletes,
    userCount: b._count.users,
    createdAt: b.createdAt,
  }));

  return {
    totalBoxes,
    totalAthletes,
    totalUsers,
    boxesByStatus,
    boxes: mappedBoxes,
  };
}
