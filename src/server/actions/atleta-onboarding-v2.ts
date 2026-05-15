"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "../db";
import type {
  FitnessReason,
  BiologicalSex,
  FitnessExperience,
  FitnessGoal,
  RoutinePreference,
  TrainingLocation,
} from "@prisma/client";

export type CompleteAtletaOnboardingInput = {
  fitnessReason: FitnessReason;
  biologicalSex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  trackMenstrualCycle: boolean;
  fitnessExperience: FitnessExperience;
  fitnessGoal: FitnessGoal;
  weeklyFrequency: number;
  routinePreference: RoutinePreference;
  excludedMuscles: string[];
  trainingLocation: TrainingLocation;
  trainsOnOwnToo: boolean;
  pushNotificationsEnabled: boolean;
};

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string; message: string };

export async function completeAtletaOnboarding(
  input: CompleteAtletaOnboardingInput,
): Promise<OnboardingResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, error: "UNAUTH", message: "Sesión expirada" };
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  try {
    const athlete = await prismaBase.athlete.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!athlete) {
      return { ok: false, error: "NOT_FOUND", message: "Atleta no encontrado" };
    }

    await prismaBase.athlete.update({
      where: { id: athlete.id },
      data: {
        fitnessReason: input.fitnessReason,
        biologicalSex: input.biologicalSex,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        ageYears: input.ageYears,
        trackMenstrualCycle: input.trackMenstrualCycle,
        fitnessExperience: input.fitnessExperience,
        fitnessGoal: input.fitnessGoal,
        weeklyFrequency: input.weeklyFrequency,
        routinePreference: input.routinePreference,
        excludedMuscles: input.excludedMuscles,
        trainingLocation: input.trainingLocation,
        trainsOnOwnToo: input.trainsOnOwnToo,
        pushNotificationsEnabled: input.pushNotificationsEnabled ?? false,
        onboardingCompletedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("[onboarding-v2] error:", err);
    return {
      ok: false,
      error: "INTERNAL",
      message: "Error guardando datos",
    };
  }
}
