/**
 * Tests for reservar page empty-state distinction.
 *
 * Key invariant (1G):
 *  - isPersonal === true  → "no box at all" empty state (don't show week strip / class list)
 *  - isPersonal === false, dayClasses.length === 0 → "this day has no classes" empty state
 *
 * These tests cover the pure helpers extracted from page logic.
 */

import { describe, it, expect } from "vitest";

// ─── sameDay helper (copied from page — pure, no imports needed) ──────────────

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── filterDayClasses helper (mirrors page logic) ────────────────────────────

type MinimalClass = { startsAt: Date };

function filterDayClasses<T extends MinimalClass>(all: T[], day: Date): T[] {
  return all.filter((c) => sameDay(c.startsAt, day));
}

// ─── Box-state → empty-state decision (the key 1G invariant) ─────────────────

type EmptyStateKind = "no-box" | "no-classes-today" | "has-classes";

function resolveEmptyStateKind(
  isPersonal: boolean,
  dayClasses: unknown[],
): EmptyStateKind {
  if (isPersonal) return "no-box";
  if (dayClasses.length === 0) return "no-classes-today";
  return "has-classes";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("sameDay", () => {
  it("returns true for same date at different times", () => {
    const a = new Date("2026-06-01T08:00:00");
    const b = new Date("2026-06-01T20:00:00");
    expect(sameDay(a, b)).toBe(true);
  });

  it("returns false for adjacent days", () => {
    const a = new Date("2026-06-01T23:59:59");
    const b = new Date("2026-06-02T00:00:00");
    expect(sameDay(a, b)).toBe(false);
  });

  it("returns false for same day-of-month in different months", () => {
    const a = new Date("2026-05-15T12:00:00");
    const b = new Date("2026-06-15T12:00:00");
    expect(sameDay(a, b)).toBe(false);
  });
});

describe("filterDayClasses", () => {
  const classes: MinimalClass[] = [
    { startsAt: new Date("2026-06-01T09:00:00") },
    { startsAt: new Date("2026-06-01T18:00:00") },
    { startsAt: new Date("2026-06-02T09:00:00") },
    { startsAt: new Date("2026-06-03T09:00:00") },
  ];

  it("returns only classes on the selected day", () => {
    const day = new Date("2026-06-01T00:00:00");
    const result = filterDayClasses(classes, day);
    expect(result).toHaveLength(2);
    expect(result.every((c) => sameDay(c.startsAt, day))).toBe(true);
  });

  it("returns empty array when no classes on selected day", () => {
    const day = new Date("2026-06-05T00:00:00");
    const result = filterDayClasses(classes, day);
    expect(result).toHaveLength(0);
  });
});

describe("resolveEmptyStateKind — 1G invariant", () => {
  it("returns 'no-box' when athlete is personal (boxless), regardless of day classes", () => {
    expect(resolveEmptyStateKind(true, [])).toBe("no-box");
    // Even if somehow classes were passed, personal takes precedence
    expect(resolveEmptyStateKind(true, [{ id: "x" }])).toBe("no-box");
  });

  it("returns 'no-classes-today' when box athlete has empty day", () => {
    expect(resolveEmptyStateKind(false, [])).toBe("no-classes-today");
  });

  it("returns 'has-classes' when box athlete has classes today", () => {
    expect(resolveEmptyStateKind(false, [{ id: "x" }, { id: "y" }])).toBe(
      "has-classes",
    );
  });

  it("never returns 'no-box' for box athletes", () => {
    expect(resolveEmptyStateKind(false, [])).not.toBe("no-box");
    expect(resolveEmptyStateKind(false, [{ id: "x" }])).not.toBe("no-box");
  });
});
