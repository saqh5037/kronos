import { describe, it, expect } from "vitest";
import { periodLabel, periodSubtitle } from "@/app/admin/_lib/period";
import { rangeFromPreset } from "@/lib/dates";

describe("periodLabel", () => {
  it("labels a preset range with its own name", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    expect(periodLabel(rangeFromPreset("last30", now))).toBe("Últimos 30 días");
    expect(periodLabel(rangeFromPreset("last7", now))).toBe("Últimos 7 días");
    expect(periodLabel(rangeFromPreset("today", now))).toBe("Hoy");
  });

  it("cannot print a period the range was not computed for", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    // The asistencia bug: subtitle said 7 days while the filter said 30.
    expect(periodLabel(rangeFromPreset("last30", now))).not.toBe(
      "Últimos 7 días",
    );
  });

  it("prints both ends for a custom range", () => {
    const range = {
      from: new Date("2026-09-01T06:00:00Z"),
      to: new Date("2026-09-15T05:59:59Z"),
    };
    expect(periodLabel(range, "UTC")).toBe("1 sep – 15 sep");
  });
});

describe("periodSubtitle", () => {
  it("puts the active period in front of the number", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    expect(
      periodSubtitle(
        rangeFromPreset("last30", now),
        170,
        "asistencia",
        "asistencias",
      ),
    ).toBe("Últimos 30 días · 170 asistencias");
  });

  it("uses the singular for one", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    expect(
      periodSubtitle(
        rangeFromPreset("today", now),
        1,
        "asistencia",
        "asistencias",
      ),
    ).toBe("Hoy · 1 asistencia");
  });

  it("derives a default plural", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    expect(periodSubtitle(rangeFromPreset("last7", now), 3, "atleta")).toBe(
      "Últimos 7 días · 3 atletas",
    );
  });
});
