import { describe, it, expect } from "vitest";
import { wodSchema } from "../../src/lib/validations/wod";
import { movementSchema } from "../../src/lib/validations/movement";

describe("wodSchema", () => {
  it("parses minimal WOD with defaults", () => {
    const parsed = wodSchema.parse({ name: "Fran" });
    expect(parsed.type).toBe("FORTIME");
    expect(parsed.scoreType).toBe("TIME");
    expect(parsed.movements).toEqual([]);
    expect(parsed.timeCap).toBeUndefined();
  });

  it("rejects empty name", () => {
    expect(() => wodSchema.parse({ name: "" })).toThrow();
  });

  it("rejects unknown type", () => {
    expect(() => wodSchema.parse({ name: "x", type: "INVALID" })).toThrow();
  });

  it("converts timeCap=0 to null", () => {
    const parsed = wodSchema.parse({ name: "x", timeCap: 0 });
    expect(parsed.timeCap).toBeNull();
  });

  it("trims empty description to undefined", () => {
    const parsed = wodSchema.parse({ name: "x", description: "" });
    expect(parsed.description).toBeUndefined();
  });

  it("accepts movements array with reps and weight", () => {
    const parsed = wodSchema.parse({
      name: "Helen",
      type: "FORTIME",
      movements: [
        { movementId: "m1", reps: 21, order: 0 },
        { movementId: "m2", reps: 12, weight: 24, order: 1 },
      ],
    });
    expect(parsed.movements).toHaveLength(2);
    expect(parsed.movements[1].weight).toBe(24);
  });

  it("rejects movement without movementId", () => {
    expect(() =>
      wodSchema.parse({
        name: "x",
        movements: [{ movementId: "", reps: 10 }],
      }),
    ).toThrow();
  });

  it("coerces string numbers (form data)", () => {
    const parsed = wodSchema.parse({
      name: "x",
      timeCap: "20",
      movements: [{ movementId: "m1", reps: "15", weight: "30", order: "0" }],
    });
    expect(parsed.timeCap).toBe(20);
    expect(parsed.movements[0].reps).toBe(15);
    expect(parsed.movements[0].weight).toBe(30);
  });
});

describe("movementSchema", () => {
  it("parses minimal movement", () => {
    const parsed = movementSchema.parse({ name: "Air Squat" });
    expect(parsed.equipment).toEqual([]);
    expect(parsed.videoUrl).toBeNull();
  });

  it("rejects empty name", () => {
    expect(() => movementSchema.parse({ name: "" })).toThrow();
  });

  it("normalizes empty videoUrl to null", () => {
    const parsed = movementSchema.parse({ name: "x", videoUrl: "" });
    expect(parsed.videoUrl).toBeNull();
  });

  it("rejects invalid videoUrl format", () => {
    expect(() =>
      movementSchema.parse({ name: "x", videoUrl: "not-a-url" }),
    ).toThrow();
  });

  it("accepts valid videoUrl", () => {
    const parsed = movementSchema.parse({
      name: "x",
      videoUrl: "https://youtu.be/abc",
    });
    expect(parsed.videoUrl).toBe("https://youtu.be/abc");
  });

  it("accepts equipment array", () => {
    const parsed = movementSchema.parse({
      name: "Snatch",
      equipment: ["Barbell", "Bumper plates"],
    });
    expect(parsed.equipment).toHaveLength(2);
  });
});
