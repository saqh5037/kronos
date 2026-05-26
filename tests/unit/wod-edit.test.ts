import { describe, it, expect } from "vitest";
import { normalizeWODMovements } from "../../src/lib/wod-helpers";

describe("normalizeWODMovements", () => {
  it("assigns sequential order (index-based) regardless of input order values", () => {
    const input = [
      { movementId: "a", order: 0 },
      { movementId: "b", order: 0 }, // duplicate — must resolve
      { movementId: "c", order: 0 },
    ];
    const result = normalizeWODMovements(input);
    expect(result.map((r) => r.order)).toEqual([0, 1, 2]);
  });

  it("preserves order when already sequential", () => {
    const input = [
      { movementId: "x", order: 0 },
      { movementId: "y", order: 1 },
      { movementId: "z", order: 2 },
    ];
    const result = normalizeWODMovements(input);
    expect(result.map((r) => r.order)).toEqual([0, 1, 2]);
  });

  it("coerces falsy reps/weight to null in output", () => {
    const input = [
      { movementId: "a", reps: undefined, weight: null, order: 0 },
    ];
    const result = normalizeWODMovements(input);
    expect(result[0].reps).toBeNull();
    expect(result[0].weight).toBeNull();
  });

  it("preserves valid reps and weight", () => {
    const input = [{ movementId: "a", reps: 21, weight: 95, order: 0 }];
    const result = normalizeWODMovements(input);
    expect(result[0].reps).toBe(21);
    expect(result[0].weight).toBe(95);
  });

  it("preserves notes", () => {
    const input = [{ movementId: "a", notes: "rx: 95lb", order: 0 }];
    const result = normalizeWODMovements(input);
    expect(result[0].notes).toBe("rx: 95lb");
  });

  it("returns empty array from empty input", () => {
    expect(normalizeWODMovements([])).toEqual([]);
  });
});
