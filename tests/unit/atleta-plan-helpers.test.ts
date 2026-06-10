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
  it("includes the year in the formatted string", () => {
    const date = new Date("2026-09-01T12:00:00.000Z");
    expect(formatDeadline(date)).toContain("2026");
  });

  it("includes a recognizable month reference (es-MX)", () => {
    const date = new Date("2026-09-01T12:00:00.000Z");
    const formatted = formatDeadline(date).toLowerCase();
    // es-MX can render "septiembre" or abbreviated "sep"
    expect(formatted).toMatch(/sep/);
  });
});
