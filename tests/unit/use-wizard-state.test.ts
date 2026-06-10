import { describe, it, expect } from "vitest";
import { deriveTrainingLocation } from "@/app/atleta/onboarding/lib/derive-training-location";

/**
 * Tests for the pure transition logic that determines trainingLocation
 * based on isB2B and trainsOnOwnToo. This function is extracted from
 * use-wizard-state so it can be tested without React hooks or localStorage.
 */
describe("deriveTrainingLocation — B2B auto-set logic", () => {
  it("B2B + trainsOnOwnToo=false → BOX_B2B (LITERAL guard against nonexistent 'BOX' value)", () => {
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: false,
      currentLocation: null,
    });
    expect(result).toBe("BOX_B2B");
    // Explicit guard: must NOT be "BOX" (does not exist in TrainingLocation enum)
    expect(result).not.toBe("BOX");
  });

  it("B2B + trainsOnOwnToo=false + existing location → still returns BOX_B2B (override)", () => {
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: false,
      currentLocation: "HOME",
    });
    expect(result).toBe("BOX_B2B");
  });

  it("B2B + trainsOnOwnToo=true → null (force user to pick a secondary location)", () => {
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: true,
      currentLocation: null,
    });
    expect(result).toBeNull();
  });

  it("B2B + trainsOnOwnToo=true + existing BOX_B2B → null (reset to force real choice)", () => {
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: true,
      currentLocation: "BOX_B2B",
    });
    expect(result).toBeNull();
  });

  it("B2B + trainsOnOwnToo=true + user already picked BIG_GYM → preserve it", () => {
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: true,
      currentLocation: "BIG_GYM",
    });
    expect(result).toBe("BIG_GYM");
  });

  it("B2B: toggle ON then OFF → back to BOX_B2B", () => {
    // Simulate: trainsOnOwnToo toggled ON (reset to null)
    const afterToggleOn = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: true,
      currentLocation: "BOX_B2B",
    });
    expect(afterToggleOn).toBeNull();

    // Simulate: trainsOnOwnToo toggled OFF again (back to BOX_B2B)
    const afterToggleOff = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: false,
      currentLocation: null,
    });
    expect(afterToggleOff).toBe("BOX_B2B");
  });

  it("B2C (isB2B=false) + trainsOnOwnToo=false → null (unaffected)", () => {
    const result = deriveTrainingLocation({
      isB2B: false,
      trainsOnOwnToo: false,
      currentLocation: null,
    });
    expect(result).toBeNull();
  });

  it("B2C + trainsOnOwnToo=true → null (unaffected)", () => {
    const result = deriveTrainingLocation({
      isB2B: false,
      trainsOnOwnToo: true,
      currentLocation: null,
    });
    expect(result).toBeNull();
  });

  it("B2C + user picked HOME → preserves HOME", () => {
    const result = deriveTrainingLocation({
      isB2B: false,
      trainsOnOwnToo: false,
      currentLocation: "HOME",
    });
    expect(result).toBe("HOME");
  });

  it("B2B restore: trainsOnOwnToo=false + trainingLocation=null → normalizes to BOX_B2B", () => {
    // This is the localStorage restore scenario: a B2B athlete who had
    // trainsOnOwnToo=false but trainingLocation was never set (null)
    // — should normalize to BOX_B2B on restore
    const result = deriveTrainingLocation({
      isB2B: true,
      trainsOnOwnToo: false,
      currentLocation: null,
    });
    expect(result).toBe("BOX_B2B");
    expect(result).not.toBe("BOX"); // enum guardrail
  });
});
