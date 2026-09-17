import { describe, it, expect } from "vitest";
import {
  dashboardGreeting,
  daypartForHour,
  firstName,
  hourInTimeZone,
} from "@/app/admin/_lib/greeting";

const TZ = "America/Mexico_City";

describe("daypartForHour", () => {
  it("splits the day at 05, 12 and 19", () => {
    expect(daypartForHour(5)).toBe("morning");
    expect(daypartForHour(11)).toBe("morning");
    expect(daypartForHour(12)).toBe("afternoon");
    expect(daypartForHour(18)).toBe("afternoon");
    expect(daypartForHour(19)).toBe("evening");
    expect(daypartForHour(23)).toBe("evening");
    expect(daypartForHour(4)).toBe("evening");
  });
});

describe("firstName", () => {
  it("takes the first token", () => {
    expect(firstName("Samuel Quiroz Hernández")).toBe("Samuel");
  });

  it("collapses extra whitespace", () => {
    expect(firstName("  Emma   Soto ")).toBe("Emma");
  });

  it("is null for blank, null or undefined", () => {
    expect(firstName("")).toBeNull();
    expect(firstName("   ")).toBeNull();
    expect(firstName(null)).toBeNull();
    expect(firstName(undefined)).toBeNull();
  });
});

describe("hourInTimeZone", () => {
  it("reads the box hour, not the server hour", () => {
    // 18:00 UTC = 12:00 in Mexico City (CST, UTC-6).
    expect(hourInTimeZone(new Date("2026-09-15T18:00:00Z"), TZ)).toBe(12);
  });

  it("maps midnight to 0", () => {
    expect(hourInTimeZone(new Date("2026-09-15T06:00:00Z"), TZ)).toBe(0);
  });
});

describe("dashboardGreeting", () => {
  it("says 'Buenas tardes' at 12:52 in the box timezone (audit finding)", () => {
    const at1252 = new Date("2026-09-15T18:52:00Z");
    expect(dashboardGreeting("Samuel Quiroz", at1252, TZ)).toBe(
      "Buenas tardes, Samuel",
    );
  });

  it("says 'Buenos días' in the morning", () => {
    const at0640 = new Date("2026-09-15T12:40:00Z");
    expect(dashboardGreeting("Emma Soto", at0640, TZ)).toBe(
      "Buenos días, Emma",
    );
  });

  it("says 'Buenas noches' at night", () => {
    const at2030 = new Date("2026-09-16T02:30:00Z");
    expect(dashboardGreeting("Lobo Ramírez", at2030, TZ)).toBe(
      "Buenas noches, Lobo",
    );
  });

  it("falls back to 'Hola' with no name — never 'Owner' and never the box", () => {
    const at1252 = new Date("2026-09-15T18:52:00Z");
    expect(dashboardGreeting(null, at1252, TZ)).toBe("Hola");
    expect(dashboardGreeting("", at1252, TZ)).toBe("Hola");
    expect(dashboardGreeting(undefined, at1252, TZ)).not.toContain("Owner");
  });
});
