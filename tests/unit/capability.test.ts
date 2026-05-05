import { describe, it, expect } from "vitest";
import {
  inferCapability,
  buildCapabilityBuckets,
  pickWeakestStrongest,
} from "../../src/lib/analytics/capability";

describe("inferCapability", () => {
  it("classifies common strength lifts", () => {
    expect(inferCapability("Back Squat")).toBe("STRENGTH");
    expect(inferCapability("Deadlift")).toBe("STRENGTH");
    expect(inferCapability("Bench Press")).toBe("STRENGTH");
    expect(inferCapability("Thruster")).toBe("STRENGTH");
  });

  it("classifies olympic lifts (more specific than strength)", () => {
    expect(inferCapability("Snatch")).toBe("OLYMPIC");
    expect(inferCapability("Clean & Jerk")).toBe("OLYMPIC");
    expect(inferCapability("Power Clean")).toBe("OLYMPIC");
    expect(inferCapability("Overhead Squat")).toBe("OLYMPIC");
  });

  it("classifies cardio movements", () => {
    expect(inferCapability("Run 400m")).toBe("CARDIO");
    expect(inferCapability("Row 500m")).toBe("CARDIO");
    expect(inferCapability("Burpees")).toBe("CARDIO");
    expect(inferCapability("Double Unders")).toBe("CARDIO");
  });

  it("classifies gymnastic movements", () => {
    expect(inferCapability("Pull-up")).toBe("GYMNASTIC");
    expect(inferCapability("Muscle-up")).toBe("GYMNASTIC");
    expect(inferCapability("HSPU")).toBe("GYMNASTIC");
    expect(inferCapability("Ring Dip")).toBe("GYMNASTIC");
  });

  it("classifies core movements", () => {
    expect(inferCapability("Toes-to-Bar")).toBe("CORE");
    expect(inferCapability("GHD Sit-up")).toBe("CORE");
    expect(inferCapability("Hollow Hold")).toBe("CORE");
  });

  it("returns null for unknown movements", () => {
    expect(inferCapability("Some weird mov")).toBeNull();
    expect(inferCapability("")).toBeNull();
  });
});

describe("buildCapabilityBuckets", () => {
  it("returns 5 buckets with zero score on empty input", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [],
      boxMaxByMovement: new Map(),
    });
    expect(buckets).toHaveLength(5);
    for (const b of buckets) {
      expect(b.score).toBe(0);
      expect(b.movementCount).toBe(0);
    }
  });

  it("normalizes a PR vs box max", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [{ movementId: "m1", movementName: "Back Squat", value: 100 }],
      boxMaxByMovement: new Map([["m1", 200]]),
    });
    const strength = buckets.find((b) => b.category === "STRENGTH")!;
    expect(strength.movementCount).toBe(1);
    expect(strength.score).toBe(50); // 100/200 = 0.5 → 50
  });

  it("averages multiple movements within a category", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [
        { movementId: "m1", movementName: "Back Squat", value: 100 },
        { movementId: "m2", movementName: "Deadlift", value: 150 },
      ],
      boxMaxByMovement: new Map([
        ["m1", 200], // 50%
        ["m2", 200], // 75%
      ]),
    });
    const strength = buckets.find((b) => b.category === "STRENGTH")!;
    expect(strength.movementCount).toBe(2);
    // (0.5 + 0.75) / 2 = 0.625 → 62.5
    expect(strength.score).toBe(62.5);
  });

  it("clamps normalized score to <=1 (athlete is the box max)", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [{ movementId: "m1", movementName: "Snatch", value: 200 }],
      boxMaxByMovement: new Map([["m1", 200]]),
    });
    const oly = buckets.find((b) => b.category === "OLYMPIC")!;
    expect(oly.score).toBe(100);
  });

  it("skips movements that don't match any category", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [{ movementId: "m1", movementName: "Mystery Move", value: 100 }],
      boxMaxByMovement: new Map([["m1", 200]]),
    });
    for (const b of buckets) expect(b.movementCount).toBe(0);
  });
});

describe("pickWeakestStrongest", () => {
  it("returns nulls when no buckets are populated", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [],
      boxMaxByMovement: new Map(),
    });
    const r = pickWeakestStrongest(buckets);
    expect(r.weakest).toBeNull();
    expect(r.strongest).toBeNull();
  });

  it("picks min and max scoring populated buckets", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [
        { movementId: "m1", movementName: "Back Squat", value: 180 },
        { movementId: "m2", movementName: "Snatch", value: 60 },
      ],
      boxMaxByMovement: new Map([
        ["m1", 200], // STRENGTH 90
        ["m2", 100], // OLYMPIC 60
      ]),
    });
    const r = pickWeakestStrongest(buckets);
    expect(r.strongest).toBe("Fuerza");
    expect(r.weakest).toBe("Olympic");
  });
});
