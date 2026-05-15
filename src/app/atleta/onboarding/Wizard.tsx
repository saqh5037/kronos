"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import KCard from "@/components/kronos/KCard";
import { kToast } from "@/lib/toast";
import { completeAtletaOnboarding } from "@/server/actions/atleta-onboarding-v2";
import { markOnboarded } from "@/lib/pwa-visits";
import { ProgressBar } from "@/components/kronos/forms";
import { useWizardState } from "./lib/use-wizard-state";
import {
  Step1Reason,
  Step2PhysicalProfile,
  Step3Experience,
  Step4Goal,
  Step5Frequency,
  Step6Routine,
  Step7ExcludedMuscles,
  Step8Location,
  Step9Notifications,
} from "./steps";

type Props = {
  isB2B: boolean;
  boxName: string;
  coachName: string | null;
};

const TOTAL_STEPS = 9;

export default function OnboardingWizard({ isB2B, boxName, coachName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    state,
    setStep,
    setFitnessReason,
    setBiologicalSex,
    setWeight,
    setHeight,
    setAge,
    setTrackMenstrualCycle,
    setFitnessExperience,
    setFitnessGoal,
    setWeeklyFrequency,
    setRoutinePreference,
    setExcludedMuscles,
    setTrainingLocation,
    setTrainsOwnToo,
  } = useWizardState();

  function next() {
    if (state.step < TOTAL_STEPS) {
      setStep(state.step + 1);
    }
  }

  function prev() {
    if (state.step > 1) {
      setStep(state.step - 1);
    }
  }

  async function finish() {
    // Validate all required fields
    if (
      !state.fitnessReason ||
      !state.biologicalSex ||
      !state.weightKg ||
      !state.heightCm ||
      !state.ageYears ||
      !state.fitnessExperience ||
      !state.fitnessGoal ||
      !state.weeklyFrequency ||
      !state.routinePreference ||
      !state.trainingLocation
    ) {
      kToast.error("Completa todos los campos para continuar");
      return;
    }

    startTransition(async () => {
      const result = await completeAtletaOnboarding({
        fitnessReason: state.fitnessReason!,
        biologicalSex: state.biologicalSex!,
        weightKg: state.weightKg!,
        heightCm: state.heightCm!,
        ageYears: state.ageYears!,
        trackMenstrualCycle: state.trackMenstrualCycle,
        fitnessExperience: state.fitnessExperience!,
        fitnessGoal: state.fitnessGoal!,
        weeklyFrequency: state.weeklyFrequency!,
        routinePreference: state.routinePreference!,
        excludedMuscles: state.excludedMuscles,
        trainingLocation: state.trainingLocation!,
        trainsOnOwnToo: state.trainsOnOwnToo,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
      });

      if (!result.ok) {
        kToast.error(result.message);
        return;
      }

      markOnboarded();
      // Clear wizard state from localStorage
      try {
        localStorage.removeItem("kronos_wizard_state");
      } catch {
        // ignore
      }
      kToast.success("¡Listo! Bienvenido a Kronos");
      router.push("/atleta");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <p
          className="font-mono text-[11px] uppercase tracking-wider mb-2"
          style={{ color: "var(--k-t3)" }}
        >
          Paso {state.step} de {TOTAL_STEPS}
        </p>
        <ProgressBar step={state.step} total={TOTAL_STEPS} />
      </div>

      <KCard animate={false}>
        <div className="p-6">
          {state.step === 1 && (
            <Step1Reason
              reason={state.fitnessReason}
              onReasonChange={setFitnessReason}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 2 && (
            <Step2PhysicalProfile
              biologicalSex={state.biologicalSex}
              weightKg={state.weightKg}
              heightCm={state.heightCm}
              ageYears={state.ageYears}
              trackMenstrualCycle={state.trackMenstrualCycle}
              onBiologicalSexChange={setBiologicalSex}
              onWeightChange={setWeight}
              onHeightChange={setHeight}
              onAgeChange={setAge}
              onMenstrualCycleChange={setTrackMenstrualCycle}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 3 && (
            <Step3Experience
              experience={state.fitnessExperience}
              onExperienceChange={setFitnessExperience}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 4 && (
            <Step4Goal
              goal={state.fitnessGoal}
              onGoalChange={setFitnessGoal}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 5 && (
            <Step5Frequency
              frequency={state.weeklyFrequency}
              experience={state.fitnessExperience}
              onFrequencyChange={setWeeklyFrequency}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 6 && (
            <Step6Routine
              preference={state.routinePreference}
              onPreferenceChange={setRoutinePreference}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 7 && (
            <Step7ExcludedMuscles
              excluded={state.excludedMuscles}
              onExcludedChange={setExcludedMuscles}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 8 && (
            <Step8Location
              isB2B={isB2B}
              boxName={boxName}
              coachName={coachName}
              trainingLocation={state.trainingLocation}
              trainsOnOwnToo={state.trainsOnOwnToo}
              onLocationChange={setTrainingLocation}
              onTrainsOwnChange={setTrainsOwnToo}
              onPrev={prev}
              onNext={next}
              pending={pending}
            />
          )}
          {state.step === 9 && (
            <Step9Notifications
              onPrev={prev}
              onNext={finish}
              pending={pending}
            />
          )}
        </div>
      </KCard>

      <p
        className="text-center text-[11px] mt-4"
        style={{ color: "var(--k-t3)" }}
      >
        Puedes cambiar todo después desde tu perfil.
      </p>
    </div>
  );
}
