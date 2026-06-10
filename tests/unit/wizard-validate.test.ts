import { describe, it, expect } from "vitest";
import {
  validateWizard,
  type WizardValidationInput,
} from "@/app/atleta/onboarding/lib/validate-wizard";

const COMPLETE_STATE: WizardValidationInput = {
  fitnessReason: "BEGINNER_START",
  biologicalSex: "MALE",
  weightKg: 80,
  heightCm: 175,
  ageYears: 28,
  fitnessExperience: "BEGINNER",
  fitnessGoal: "GENERAL_FITNESS",
  weeklyFrequency: 3,
  routinePreference: "AUTO",
  trainingLocation: "BOX_B2B",
};

describe("validateWizard", () => {
  it("returns null for a fully complete state", () => {
    expect(validateWizard(COMPLETE_STATE)).toBeNull();
  });

  it("returns step 1 and field fitnessReason when missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, fitnessReason: null });
    expect(result).not.toBeNull();
    expect(result!.field).toBe("fitnessReason");
    expect(result!.step).toBe(1);
    expect(typeof result!.message).toBe("string");
    expect(result!.message.length).toBeGreaterThan(0);
  });

  it("returns step 2 when biologicalSex is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, biologicalSex: null });
    expect(result!.step).toBe(2);
    expect(result!.field).toBe("biologicalSex");
  });

  it("returns step 2 when weightKg is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, weightKg: null });
    expect(result!.step).toBe(2);
    expect(result!.field).toBe("weightKg");
  });

  it("returns step 2 when heightCm is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, heightCm: null });
    expect(result!.step).toBe(2);
    expect(result!.field).toBe("heightCm");
  });

  it("returns step 2 when ageYears is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, ageYears: null });
    expect(result!.step).toBe(2);
    expect(result!.field).toBe("ageYears");
  });

  it("returns step 3 when fitnessExperience is missing", () => {
    const result = validateWizard({
      ...COMPLETE_STATE,
      fitnessExperience: null,
    });
    expect(result!.step).toBe(3);
    expect(result!.field).toBe("fitnessExperience");
  });

  it("returns step 4 when fitnessGoal is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, fitnessGoal: null });
    expect(result!.step).toBe(4);
    expect(result!.field).toBe("fitnessGoal");
  });

  it("returns step 5 when weeklyFrequency is missing", () => {
    const result = validateWizard({ ...COMPLETE_STATE, weeklyFrequency: null });
    expect(result!.step).toBe(5);
    expect(result!.field).toBe("weeklyFrequency");
  });

  it("returns step 6 when routinePreference is missing", () => {
    const result = validateWizard({
      ...COMPLETE_STATE,
      routinePreference: null,
    });
    expect(result!.step).toBe(6);
    expect(result!.field).toBe("routinePreference");
  });

  it("returns step 8 when trainingLocation is missing", () => {
    const result = validateWizard({
      ...COMPLETE_STATE,
      trainingLocation: null,
    });
    expect(result!.step).toBe(8);
    expect(result!.field).toBe("trainingLocation");
  });

  it("returns the FIRST missing field (step 1) when multiple are missing", () => {
    const result = validateWizard({
      ...COMPLETE_STATE,
      fitnessReason: null,
      fitnessGoal: null,
      trainingLocation: null,
    });
    expect(result!.step).toBe(1);
    expect(result!.field).toBe("fitnessReason");
  });

  it("message is specific to the missing field, not a generic fallback", () => {
    const locationResult = validateWizard({
      ...COMPLETE_STATE,
      trainingLocation: null,
    });
    const sexResult = validateWizard({
      ...COMPLETE_STATE,
      biologicalSex: null,
    });
    // Messages must differ — not a single "Completa todos los campos"
    expect(locationResult!.message).not.toBe(sexResult!.message);
  });
});
