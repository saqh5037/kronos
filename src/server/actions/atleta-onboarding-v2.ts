"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "../db";
import { logAudit } from "../audit";
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

    await logAudit({
      tenantId,
      actorId: userId,
      action: "ATHLETE_ONBOARDING_COMPLETED",
      targetType: "Athlete",
      targetId: athlete.id,
      metadata: {
        fitnessReason: input.fitnessReason,
        fitnessGoal: input.fitnessGoal,
        trainingLocation: input.trainingLocation,
        weeklyFrequency: input.weeklyFrequency,
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

/**
 * Logger ligero por step. Fire-and-forget desde el wizard. No bloquea la
 * navegación si falla — logAudit ya catchea y no rethrowa.
 */
export async function logOnboardingStep(stepNumber: number): Promise<void> {
  if (stepNumber < 1 || stepNumber > 9) return;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) return;

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const athlete = await prismaBase.athlete.findFirst({
    where: { tenantId, userId },
    select: { id: true },
  });
  if (!athlete) return;

  await logAudit({
    tenantId,
    actorId: userId,
    action: "ATHLETE_ONBOARDING_STEP_COMPLETED",
    targetType: "Athlete",
    targetId: athlete.id,
    metadata: { step_number: stepNumber },
  });
}
