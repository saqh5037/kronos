import { describe, it, expect } from "vitest";
import {
  confidenceBand,
  confidenceLabel,
  daysUntil,
  formatDaysUntil,
  formatDeadlineWithCountdown,
  rankLabel,
  percentileLabel,
  capabilityScoreLabel,
  normalizeNarrative,
} from "@/lib/scores/copy";
import { capabilityCategoriesView } from "@/lib/scores/capability-view";

describe("confidence bands", () => {
  it("never prints a percentage", () => {
    expect(confidenceLabel(0.99)).toBe("confianza alta");
    expect(confidenceLabel(0.6)).toBe("confianza media");
    expect(confidenceLabel(0.2)).toBe("confianza baja");
    expect(confidenceLabel(0.99)).not.toMatch(/%|\d/);
  });

  it("accepts both the 0..1 and the 0..100 scale", () => {
    expect(confidenceBand(0.8)).toBe("alta");
    expect(confidenceBand(80)).toBe("alta");
    expect(confidenceBand(50)).toBe("media");
    expect(confidenceBand(10)).toBe("baja");
  });

  it("falls back to the lowest band for garbage", () => {
    expect(confidenceBand(Number.NaN)).toBe("baja");
  });

  it("puts the boundaries on the safe side", () => {
    expect(confidenceBand(0.75)).toBe("alta");
    expect(confidenceBand(0.7499)).toBe("media");
    expect(confidenceBand(0.45)).toBe("media");
    expect(confidenceBand(0.4499)).toBe("baja");
  });
});

describe("faltan N días", () => {
  const now = new Date(2026, 8, 15, 9, 30); // 15 sep 2026, local

  it("counts whole calendar days regardless of the time of day", () => {
    expect(daysUntil(new Date(2026, 9, 3, 0, 1), now)).toBe(18);
    expect(daysUntil(new Date(2026, 8, 15, 23, 59), now)).toBe(0);
  });

  it("reads as an action, not a date", () => {
    expect(formatDaysUntil(new Date(2026, 9, 3), now)).toBe("faltan 18 días");
    expect(formatDaysUntil(new Date(2026, 8, 15), now)).toBe("hoy");
    expect(formatDaysUntil(new Date(2026, 8, 16), now)).toBe("mañana");
    expect(formatDaysUntil(new Date(2026, 8, 14), now)).toBe("venció ayer");
    expect(formatDaysUntil(new Date(2026, 8, 12), now)).toBe(
      "venció hace 3 días",
    );
  });

  it("puts the countdown before the short date", () => {
    const label = formatDeadlineWithCountdown(new Date(2026, 9, 3), now);
    expect(label.startsWith("faltan 18 días · ")).toBe(true);
    expect(label).not.toMatch(/OCTUBRE|2026/);
  });
});

describe("empty cohorts say 'sin datos'", () => {
  it("never renders '#0 de N' or '0 % percentil'", () => {
    expect(rankLabel(0, 3)).toBe("sin datos");
    expect(rankLabel(null, 3)).toBe("sin datos");
    expect(rankLabel(2, 0)).toBe("sin datos");
    expect(rankLabel(3, 36)).toBe("#3 de 36");

    expect(percentileLabel(null, 3)).toBe("sin datos");
    expect(percentileLabel(0, 0)).toBe("sin datos");
    expect(percentileLabel(72, 36)).toBe("72 % del box");
  });

  it("distinguishes a real zero score from absent data", () => {
    expect(capabilityScoreLabel(null)).toBe("sin datos");
    expect(capabilityScoreLabel(undefined)).toBe("sin datos");
    expect(capabilityScoreLabel(0)).toBe("0");
    expect(capabilityScoreLabel(71.6)).toBe("72");
  });
});

describe("capability categories view", () => {
  const raw = [
    { category: "STRENGTH", label: "Fuerza", score: 82, movementCount: 4 },
    { category: "CARDIO", label: "Cardio", score: 0, movementCount: 0 },
    { category: "CORE", label: "Core", score: 0, movementCount: 0 },
    { category: "OLYMPIC", label: "Olympic", score: 41, movementCount: 2 },
  ];

  it("returns null instead of 0 for a category with no movements", () => {
    const view = capabilityCategoriesView(raw);
    expect(view.find((c) => c.category === "CARDIO")!.score).toBeNull();
    expect(view.find((c) => c.category === "CORE")!.score).toBeNull();
    expect(view.find((c) => c.category === "STRENGTH")!.score).toBe(82);
  });

  it("labels the empty categories 'sin datos'", () => {
    const view = capabilityCategoriesView(raw);
    expect(view.find((c) => c.category === "CARDIO")!.display).toBe(
      "sin datos",
    );
    expect(view.find((c) => c.category === "STRENGTH")!.display).toBe("82");
  });

  it("keeps a genuine zero as a zero", () => {
    const view = capabilityCategoriesView([
      { category: "CARDIO", label: "Cardio", score: 0, movementCount: 3 },
    ]);
    expect(view[0].score).toBe(0);
    expect(view[0].display).toBe("0");
  });

  it("translates the English category label", () => {
    const view = capabilityCategoriesView(raw);
    expect(view.find((c) => c.category === "OLYMPIC")!.name).toBe("Olímpico");
    expect(view.map((c) => c.name)).not.toContain("Olympic");
  });
});

describe("narrative boundary guard", () => {
  it("replaces the English leak the AI generator still emits", () => {
    expect(
      normalizeNarrative(
        "Tu PR actual de Back Squat es 120 kg. Necesitamos al menos 3 attempts para predecir.",
      ),
    ).toBe(
      "Tu PR actual de Back Squat es 120 kg. Necesitamos al menos 3 intentos para predecir.",
    );
    expect(normalizeNarrative("Empieza a registrar attempts.")).toBe(
      "Empieza a registrar intentos.",
    );
  });

  it("leaves clean Spanish untouched", () => {
    const clean = "Vas en alza: +5 kg en las últimas 3 semanas.";
    expect(normalizeNarrative(clean)).toBe(clean);
  });
});
