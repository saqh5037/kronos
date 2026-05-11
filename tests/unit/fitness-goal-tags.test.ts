import { describe, it, expect } from "vitest";
import {
  readFitnessGoalTags,
  withFitnessGoalTags,
  isWellnessAudience,
} from "../../src/lib/validations/athlete";

describe("fitness goal tags", () => {
  it("readFitnessGoalTags filters prefixed tags only", () => {
    const tags = ["level:rx", "goal:wellness", "goal:weight_loss", "other"];
    expect(readFitnessGoalTags(tags)).toEqual(["wellness", "weight_loss"]);
  });

  it("readFitnessGoalTags ignores unknown goal:* values", () => {
    expect(readFitnessGoalTags(["goal:invalid", "goal:wellness"])).toEqual([
      "wellness",
    ]);
  });

  it("withFitnessGoalTags replaces existing goal:* prefixes preserving others", () => {
    const result = withFitnessGoalTags(
      ["level:scaled", "goal:competitive", "custom:foo"],
      ["wellness", "weight_loss"],
    );
    expect(result).toContain("level:scaled");
    expect(result).toContain("custom:foo");
    expect(result).toContain("goal:wellness");
    expect(result).toContain("goal:weight_loss");
    expect(result).not.toContain("goal:competitive");
  });

  it("withFitnessGoalTags dedupes new goals", () => {
    const result = withFitnessGoalTags([], ["wellness", "wellness"]);
    expect(result).toEqual(["goal:wellness"]);
  });

  it("isWellnessAudience is true for wellness/weight_loss/muscle_gain", () => {
    expect(isWellnessAudience(["goal:wellness"])).toBe(true);
    expect(isWellnessAudience(["goal:weight_loss"])).toBe(true);
    expect(isWellnessAudience(["goal:muscle_gain"])).toBe(true);
  });

  it("isWellnessAudience is false when competitive is also present", () => {
    expect(isWellnessAudience(["goal:wellness", "goal:competitive"])).toBe(
      false,
    );
  });

  it("isWellnessAudience is false with no goal tags", () => {
    expect(isWellnessAudience([])).toBe(false);
    expect(isWellnessAudience(["level:rx"])).toBe(false);
  });

  it("isWellnessAudience is false when only competitive", () => {
    expect(isWellnessAudience(["goal:competitive"])).toBe(false);
  });
});
