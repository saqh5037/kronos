import { describe, it, expect } from "vitest";
import {
  goalMetricLabel,
  normalizeGoalId,
  formatDeadline,
} from "../../src/app/atleta/plan/_helpers";

describe("goalMetricLabel", () => {
  it("maps known metrics to Spanish labels", () => {
    expect(goalMetricLabel("PR")).toBe("PR");
    expect(goalMetricLabel("TONNAGE")).toBe("Tonelaje");
    expect(goalMetricLabel("ATTENDANCE")).toBe("Asistencia");
    expect(goalMetricLabel("BODY_COMPOSITION")).toBe("Composición corporal");
  });

  it("returns 'objetivo' for unknown metric", () => {
    expect(goalMetricLabel("UNKNOWN")).toBe("objetivo");
    expect(goalMetricLabel("")).toBe("objetivo");
  });
});

describe("normalizeGoalId", () => {
  it("returns null for undefined", () => {
    expect(normalizeGoalId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeGoalId("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeGoalId("   ")).toBeNull();
  });

  it("trims surrounding whitespace from a valid id", () => {
    expect(normalizeGoalId("  abc123  ")).toBe("abc123");
  });

  it("returns the id unchanged when already clean", () => {
    expect(normalizeGoalId("clxyz123abc")).toBe("clxyz123abc");
  });
});

describe("formatDeadline", () => {
  // Audit 2026-09-15 (P2 copy, /atleta/plan): the deadline used to render as
  // "3 DE OCTUBRE DE 2026" — a full uppercase line the athlete had to do date
  // arithmetic on. It now leads with the countdown and keeps a short date, so
  // the old "must contain the year" expectation is deliberately gone.
  it("leads with the countdown, not the long date", () => {
    const now = new Date(2026, 8, 15);
    expect(formatDeadline(new Date(2026, 9, 3), now)).toBe(
      "faltan 18 días · 3 oct",
    );
  });

  it("includes a recognizable month reference (es-MX)", () => {
    const now = new Date(2026, 7, 20);
    const formatted = formatDeadline(new Date(2026, 8, 1), now).toLowerCase();
    // es-MX can render "septiembre" or abbreviated "sep"
    expect(formatted).toMatch(/sep/);
  });
});
