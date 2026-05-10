import { describe, it, expect } from "vitest";
import { getAthleteLevel } from "@/lib/badges/level";

describe("getAthleteLevel", () => {
  it("returns level 1 at 0 XP", () => {
    const info = getAthleteLevel(0);
    expect(info.level).toBe(1);
    expect(info.xpInLevel).toBe(0);
    expect(info.xpToNext).toBe(300);
    expect(info.threshold).toBe(0);
    expect(info.nextThreshold).toBe(300);
    expect(info.progressToNext).toBe(0);
  });

  it("returns level 1 just below threshold", () => {
    const info = getAthleteLevel(299);
    expect(info.level).toBe(1);
    expect(info.xpInLevel).toBe(299);
    expect(info.xpToNext).toBe(1);
  });

  it("returns level 2 at exactly 300 XP", () => {
    const info = getAthleteLevel(300);
    expect(info.level).toBe(2);
    expect(info.xpInLevel).toBe(0);
    expect(info.xpToNext).toBe(500);
    expect(info.threshold).toBe(300);
  });

  it("returns level 3 at 800", () => {
    const info = getAthleteLevel(800);
    expect(info.level).toBe(3);
    expect(info.xpToNext).toBe(1000);
  });

  it("returns level 4 at 1800", () => {
    expect(getAthleteLevel(1800).level).toBe(4);
  });

  it("returns level 5 at 3500", () => {
    const info = getAthleteLevel(3500);
    expect(info.level).toBe(5);
    expect(info.xpToNext).toBeNull();
    expect(info.nextThreshold).toBeNull();
    expect(info.progressToNext).toBe(1);
  });

  it("clamps negative XP to level 1", () => {
    expect(getAthleteLevel(-100).level).toBe(1);
  });

  it("computes mid-level progress", () => {
    const info = getAthleteLevel(550);
    expect(info.level).toBe(2);
    expect(info.xpInLevel).toBe(250);
    expect(info.progressToNext).toBeCloseTo(250 / 500, 2);
  });
});
