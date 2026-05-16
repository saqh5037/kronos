/**
 * Registry centralizado de DisciplineStrategy.
 *
 * Punto único para consumo: `getStrategy(slug)` o `getStrategyForBox(box)`.
 *
 * Agregar nueva disciplina:
 * 1. Crear `src/lib/disciplines/{slug}.ts` con la nueva strategy
 * 2. Importarla acá y agregar entry en REGISTRY
 * 3. INSERT en tabla Discipline (vía seed o admin wizard) con `strategy=<slug>`
 * 4. Crear entry correspondiente en `src/lib/branding/index.ts`
 *
 * No requiere migration de schema. Esa es la promesa de la foundation pulida.
 */

import { CrossfitStrategy } from "./crossfit";
import { HyroxStrategy } from "./hyrox";
import type { DisciplineStrategy, DisciplineSlug } from "./types";

const REGISTRY: Readonly<Record<string, DisciplineStrategy>> = {
  crossfit: CrossfitStrategy,
  hyrox: HyroxStrategy,
} as const;

export function getStrategy(slug: string): DisciplineStrategy {
  const strategy = REGISTRY[slug];
  if (!strategy) {
    throw new Error(
      `No DisciplineStrategy registrada para slug="${slug}". Disponibles: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  return strategy;
}

export function hasStrategy(slug: string): boolean {
  return slug in REGISTRY;
}

export function listStrategies(): ReadonlyArray<DisciplineStrategy> {
  return Object.values(REGISTRY);
}

export function listStrategySlugs(): ReadonlyArray<DisciplineSlug> {
  return Object.keys(REGISTRY) as DisciplineSlug[];
}
