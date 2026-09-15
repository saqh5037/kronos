/**
 * Events (audit 2026-09-15): a past event was listed under "EVENTOS ABIERTOS",
 * its detail page was "a closed door — no result, no rank", and dates carried
 * no sense of distance ("3 DE OCTUBRE DE 2026", no "faltan 18 días").
 */

import { describe, it, expect } from "vitest";
import { computeEventRank, type RankableEntry } from "@/lib/event-score";
import {
  countdownLabel,
  daysUntil,
  isPastDay,
} from "@/app/atleta/eventos/_lib/countdown";

const submitted = new Date("2026-05-23T18:00:00.000Z");

function entry(
  athleteId: string,
  scoreValue: number | null,
  division: string | null = "RX",
  submittedAt: Date | null = submitted,
): RankableEntry {
  return { athleteId, scoreValue, division, submittedAt };
}

describe("computeEventRank", () => {
  it("ranks by time ascending inside the athlete's division", () => {
    const entries = [entry("a", 3_000), entry("b", 2_400), entry("c", 2_800)];
    expect(computeEventRank(entries, "b")).toEqual({ position: 1, outOf: 3 });
    expect(computeEventRank(entries, "c")).toEqual({ position: 2, outOf: 3 });
    expect(computeEventRank(entries, "a")).toEqual({ position: 3, outOf: 3 });
  });

  it("does not mix divisions", () => {
    const entries = [
      entry("a", 3_000, "RX"),
      entry("b", 2_000, "Escalado"),
      entry("c", 2_900, "RX"),
    ];
    expect(computeEventRank(entries, "a")).toEqual({ position: 2, outOf: 2 });
    expect(computeEventRank(entries, "b")).toEqual({ position: 1, outOf: 1 });
  });

  it("shares the position on a tie", () => {
    const entries = [entry("a", 2_400), entry("b", 2_400), entry("c", 3_000)];
    expect(computeEventRank(entries, "a")?.position).toBe(1);
    expect(computeEventRank(entries, "b")?.position).toBe(1);
    expect(computeEventRank(entries, "c")?.position).toBe(3);
  });

  it("ignores entries that were never submitted", () => {
    const entries = [entry("a", 3_000), entry("b", 1_000, "RX", null)];
    expect(computeEventRank(entries, "a")).toEqual({ position: 1, outOf: 1 });
  });

  it("ignores entries with no numeric score", () => {
    const entries = [entry("a", 3_000), entry("b", null)];
    expect(computeEventRank(entries, "a")).toEqual({ position: 1, outOf: 1 });
  });

  it("returns null when the athlete has no comparable result", () => {
    expect(computeEventRank([entry("a", 3_000)], "zz")).toBeNull();
    expect(computeEventRank([entry("a", null)], "a")).toBeNull();
    expect(computeEventRank([entry("a", 1, "RX", null)], "a")).toBeNull();
    expect(computeEventRank([], "a")).toBeNull();
  });

  it("treats a null division as its own field", () => {
    const entries = [entry("a", 3_000, null), entry("b", 2_000, "RX")];
    expect(computeEventRank(entries, "a")).toEqual({ position: 1, outOf: 1 });
  });
});

describe("countdown copy", () => {
  const now = new Date("2026-09-15T10:00:00.000Z");

  it("counts whole days regardless of the time of day", () => {
    expect(daysUntil(new Date("2026-10-03T23:00:00.000Z"), now)).toBe(18);
    expect(daysUntil(new Date("2026-09-15T23:59:00.000Z"), now)).toBe(0);
    expect(daysUntil(new Date("2026-09-12T01:00:00.000Z"), now)).toBe(-3);
  });

  it("produces the 'faltan N días' the audit asked for", () => {
    expect(countdownLabel(new Date("2026-10-03T09:00:00.000Z"), now)).toBe(
      "faltan 18 días",
    );
  });

  it("names today, tomorrow and yesterday instead of counting", () => {
    expect(countdownLabel(new Date("2026-09-15T20:00:00.000Z"), now)).toBe(
      "hoy",
    );
    expect(countdownLabel(new Date("2026-09-16T05:00:00.000Z"), now)).toBe(
      "mañana",
    );
    expect(countdownLabel(new Date("2026-09-14T05:00:00.000Z"), now)).toBe(
      "ayer",
    );
  });

  it("uses the singular form for one day", () => {
    expect(countdownLabel(new Date("2026-09-12T05:00:00.000Z"), now)).toBe(
      "hace 3 días",
    );
  });

  it("classifies past days for the 'Concluidos' section", () => {
    expect(isPastDay(new Date("2026-05-23T18:00:00.000Z"), now)).toBe(true);
    expect(isPastDay(new Date("2026-09-15T01:00:00.000Z"), now)).toBe(false);
    expect(isPastDay(new Date("2026-12-01T01:00:00.000Z"), now)).toBe(false);
  });
});
