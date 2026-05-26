import { describe, it, expect } from "vitest";
import { athleteSchema } from "../../src/lib/validations/athlete";
import { buildAthleteOrderBy } from "../../src/lib/athlete-helpers";

// ─── athleteSchema: update profile coverage ─────────────────────────────────

describe("athleteSchema – profile update", () => {
  it("accepts full valid input", () => {
    const input = {
      firstName: "Daniela",
      lastName: "Ramos",
      phone: "5512345678",
      dob: "1995-07-12",
      healthHistory: "Ninguno",
      emergencyContact: "Papá 555-1111",
      notes: "Atleta avanzada",
      tags: ["level:rx"],
      status: "ACTIVE" as const,
    };
    const result = athleteSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Daniela");
      expect(result.data.dob).toBeInstanceOf(Date);
    }
  });

  it("requires firstName and lastName", () => {
    expect(
      athleteSchema.safeParse({ firstName: "", lastName: "X" }).success,
    ).toBe(false);
    expect(
      athleteSchema.safeParse({ firstName: "X", lastName: "" }).success,
    ).toBe(false);
  });

  it("optional fields default to undefined / empty", () => {
    const result = athleteSchema.safeParse({
      firstName: "Ana",
      lastName: "López",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.dob).toBeUndefined();
      expect(result.data.tags).toEqual([]);
    }
  });

  it("rejects invalid status", () => {
    const result = athleteSchema.safeParse({
      firstName: "Ana",
      lastName: "López",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

// ─── buildAthleteOrderBy helper ──────────────────────────────────────────────

describe("buildAthleteOrderBy", () => {
  it("name → firstName + lastName array", () => {
    const result = buildAthleteOrderBy("name", "asc");
    expect(result).toEqual([{ firstName: "asc" }, { lastName: "asc" }]);
  });

  it("createdAt → createdAt object", () => {
    const result = buildAthleteOrderBy("createdAt", "desc");
    expect(result).toEqual({ createdAt: "desc" });
  });

  it("lastAttendanceAt → bookings._max.checkedInAt", () => {
    const result = buildAthleteOrderBy("lastAttendanceAt", "desc");
    expect(result).toEqual({ bookings: { _max: { checkedInAt: "desc" } } });
  });

  it("totalScores → _count.scores", () => {
    const result = buildAthleteOrderBy("totalScores", "desc");
    expect(result).toEqual({ _count: { scores: "desc" } });
  });

  it("totalScores asc", () => {
    const result = buildAthleteOrderBy("totalScores", "asc");
    expect(result).toEqual({ _count: { scores: "asc" } });
  });
});
