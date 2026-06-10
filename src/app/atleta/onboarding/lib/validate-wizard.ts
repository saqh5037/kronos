import type {
  FitnessReason,
  BiologicalSex,
  FitnessExperience,
  FitnessGoal,
  RoutinePreference,
  TrainingLocation,
} from "@prisma/client";

export type WizardValidationInput = {
  fitnessReason: FitnessReason | null;
  biologicalSex: BiologicalSex | null;
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  fitnessExperience: FitnessExperience | null;
  fitnessGoal: FitnessGoal | null;
  weeklyFrequency: number | null;
  routinePreference: RoutinePreference | null;
  trainingLocation: TrainingLocation | null;
};

export type WizardValidationError = {
  field: string;
  step: number;
  message: string;
};

const CHECKS: Array<{
  field: keyof WizardValidationInput;
  step: number;
  message: string;
}> = [
  {
    field: "fitnessReason",
    step: 1,
    message: "Selecciona tu objetivo para continuar",
  },
  {
    field: "biologicalSex",
    step: 2,
    message: "Selecciona tu sexo biológico para continuar",
  },
  {
    field: "weightKg",
    step: 2,
    message: "Ingresa tu peso para continuar",
  },
  {
    field: "heightCm",
    step: 2,
    message: "Ingresa tu altura para continuar",
  },
  {
    field: "ageYears",
    step: 2,
    message: "Ingresa tu edad para continuar",
  },
  {
    field: "fitnessExperience",
    step: 3,
    message: "Selecciona tu nivel de experiencia para continuar",
  },
  {
    field: "fitnessGoal",
    step: 4,
    message: "Selecciona tu meta de entrenamiento para continuar",
  },
  {
    field: "weeklyFrequency",
    step: 5,
    message: "Indica cuántos días entrenas por semana",
  },
  {
    field: "routinePreference",
    step: 6,
    message: "Elige tu preferencia de rutina para continuar",
  },
  {
    field: "trainingLocation",
    step: 8,
    message: "Falta tu lugar de entrenamiento",
  },
];

/**
 * Validates the wizard state and returns the FIRST missing field as an error,
 * or null if the state is complete.
 *
 * Pure function — no side effects, no React, no router.
 * Consumed by Wizard.tsx finish() to navigate to the offending step and show
 * a specific toast message instead of the generic "Completa todos los campos".
 */
export function validateWizard(
  state: WizardValidationInput,
): WizardValidationError | null {
  for (const check of CHECKS) {
    const value = state[check.field];
    if (value === null || value === undefined) {
      return { field: check.field, step: check.step, message: check.message };
    }
  }
  return null;
}
