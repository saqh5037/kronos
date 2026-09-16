import { describe, expect, it } from "vitest";
import { planSessionTypeLabel } from "@/app/atleta/plan/_helpers";

/**
 * `/atleta/plan` rendered `{nextSession.type}` and `{s.type}` straight into a
 * chip. Those strings are not Prisma enums — `src/lib/ai/training-plan.ts`
 * asks the model for `"Fuerza | Met-Con | Recovery"` and substitutes a literal
 * `"—"` when parsing fails — so the athlete could see an English word, an
 * all-caps token, or a lone em dash inside a lime chip.
 */
describe("planSessionTypeLabel", () => {
  it("maps the values the plan generator is prompted to produce", () => {
    expect(planSessionTypeLabel("Fuerza")).toBe("Fuerza");
    expect(planSessionTypeLabel("Met-Con")).toBe("Met-Con");
    expect(planSessionTypeLabel("Recovery")).toBe("Recuperación");
  });

  it("is case and whitespace insensitive", () => {
    expect(planSessionTypeLabel("  METCON ")).toBe("Met-Con");
    expect(planSessionTypeLabel("recovery")).toBe("Recuperación");
  });

  it("replaces the generator's placeholder with a word", () => {
    // `"—"` is the literal fallback in src/lib/ai/training-plan.ts.
    expect(planSessionTypeLabel("—")).toBe("Sesión");
    expect(planSessionTypeLabel("-")).toBe("Sesión");
    expect(planSessionTypeLabel("")).toBe("Sesión");
    expect(planSessionTypeLabel(null)).toBe("Sesión");
    expect(planSessionTypeLabel(undefined)).toBe("Sesión");
  });

  it("humanises a value it does not know instead of dropping it", () => {
    expect(planSessionTypeLabel("Gimnasia")).toBe("Gimnasia");
    expect(planSessionTypeLabel("ROUNDS_REPS")).toBe("Rounds reps");
    expect(planSessionTypeLabel("aeróbico largo")).toBe("Aeróbico largo");
  });

  it("never returns an all-caps token", () => {
    for (const raw of ["FUERZA", "RECOVERY", "AMRAP", "EMOM"]) {
      const label = planSessionTypeLabel(raw);
      expect(label, raw).not.toBe(label.toUpperCase());
    }
  });
});
