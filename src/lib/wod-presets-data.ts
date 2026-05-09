import {
  WOD_LIBRARY,
  DEFAULT_BENCHMARK_SLUGS,
  type WodRecipe,
} from "@/server/seed-defaults";

export type BenchmarkWodOption = {
  slug: string;
  name: string;
  type: WodRecipe["type"];
  description: string;
  movements: string[];
};

export const DEFAULT_WOD_SLUGS = DEFAULT_BENCHMARK_SLUGS;

export function getBenchmarkWodPresets(): BenchmarkWodOption[] {
  return WOD_LIBRARY.map((w) => ({
    slug: w.slug,
    name: w.name,
    type: w.type,
    description: w.description,
    movements: Array.from(new Set(w.movements.map((m) => m.name))),
  }));
}
