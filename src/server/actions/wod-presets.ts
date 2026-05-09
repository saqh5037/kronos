"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb, withTenant } from "../db";
import {
  WOD_LIBRARY,
  DEFAULT_BENCHMARK_SLUGS,
  type WodRecipe,
} from "../seed-defaults";

export type BenchmarkWodOption = {
  slug: string;
  name: string;
  type: WodRecipe["type"];
  description: string;
  movements: string[];
};

export async function getBenchmarkWodPresets(): Promise<BenchmarkWodOption[]> {
  return WOD_LIBRARY.map((w) => ({
    slug: w.slug,
    name: w.name,
    type: w.type,
    description: w.description,
    movements: Array.from(new Set(w.movements.map((m) => m.name))),
  }));
}

export const DEFAULT_WOD_SLUGS = DEFAULT_BENCHMARK_SLUGS;

export type ImportResult =
  | {
      ok: true;
      created: number;
      skipped: { slug: string; reason: string }[];
    }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "FORBIDDEN";
      message: string;
    };

export async function importBenchmarkWods(input: {
  wodSlugs: string[];
}): Promise<ImportResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return {
      ok: false,
      error: "UNAUTHENTICATED",
      message: "Iniciá sesión primero",
    };
  }
  if (session.user.role !== "OWNER") {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "Solo el OWNER puede importar WODs",
    };
  }

  const tenantId = session.user.tenantId;
  const requested = WOD_LIBRARY.filter((w) => input.wodSlugs.includes(w.slug));
  if (requested.length === 0) {
    return { ok: true, created: 0, skipped: [] };
  }

  const tenantDb = withTenant(tenantId);

  const movementNames = Array.from(
    new Set(requested.flatMap((w) => w.movements.map((m) => m.name))),
  );
  const movements = await tenantDb.movement.findMany({
    where: { name: { in: movementNames } },
    select: { id: true, name: true },
  });
  const movementByName = new Map(movements.map((m) => [m.name, m.id]));

  const existing = await tenantDb.wOD.findMany({
    where: { name: { in: requested.map((w) => w.name) } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((w) => w.name));

  const skipped: { slug: string; reason: string }[] = [];
  let created = 0;

  for (const recipe of requested) {
    if (existingNames.has(recipe.name)) {
      skipped.push({ slug: recipe.slug, reason: "ya existe" });
      continue;
    }

    const missing = recipe.movements
      .map((m) => m.name)
      .filter((n) => !movementByName.has(n));
    if (missing.length > 0) {
      skipped.push({
        slug: recipe.slug,
        reason: `falta movimiento: ${missing.join(", ")}`,
      });
      continue;
    }

    await rawDb.wOD.create({
      data: {
        tenantId,
        name: recipe.name,
        type: recipe.type,
        scoreType: recipe.scoreType,
        description: recipe.description,
        timeCap: recipe.timeCap ?? null,
        movements: {
          create: recipe.movements.map((m, idx) => ({
            movementId: movementByName.get(m.name)!,
            reps: m.reps ?? null,
            weight: m.weight ?? null,
            order: idx,
          })),
        },
      },
    });
    created += 1;
  }

  return { ok: true, created, skipped };
}
