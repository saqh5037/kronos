"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import KCard from "@/components/kronos/KCard";
import { kToast } from "@/lib/toast";
import {
  completeAtletaOnboarding,
  logOnboardingStep,
  skipAtletaOnboarding,
} from "@/server/actions/atleta-onboarding-v2";
import { markOnboarded } from "@/lib/pwa-visits";
import { ProgressBar } from "@/components/kronos/forms";
import { useWizardState } from "./lib/use-wizard-state";
import { validateWizard } from "./lib/validate-wizard";
import { PlanCreatingScreen } from "./steps/PlanCreatingScreen";
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
  const [showPlanCreating, setShowPlanCreating] = useState(false);
  const [skipping, setSkipping] = useState(false);
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
  } = useWizardState(isB2B);

  function next() {
    if (state.step < TOTAL_STEPS) {
      // Fire-and-forget: el log de progreso no debe bloquear la navegación.
      // logAudit ya catchea internamente, así que el .catch acá es defensivo
      // contra errores de red durante el fetch del server action.
      const stepCompleted = state.step;
      void logOnboardingStep(stepCompleted).catch((err) => {
        console.warn("[onboarding] step audit failed:", err);
      });
      setStep(state.step + 1);
    }
  }

  function prev() {
    if (state.step > 1) {
      setStep(state.step - 1);
    }
  }

  function finish() {
    const validationError = validateWizard(state);
    if (validationError) {
      setStep(validationError.step);
      kToast.error(validationError.message);
      return;
    }

    // Step 9 cierra el flow — disparar el último STEP_COMPLETED antes de
    // arrancar la animación. completeAtletaOnboarding agrega el evento
    // ATHLETE_ONBOARDING_COMPLETED en el server action.
    void logOnboardingStep(TOTAL_STEPS).catch((err) => {
      console.warn("[onboarding] step 9 audit failed:", err);
    });

    setShowPlanCreating(true);
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      const result = await skipAtletaOnboarding();
      if (!result.ok) {
        kToast.error(
          result.message ??
            "No pudimos saltar el onboarding. Intenta de nuevo.",
        );
        setSkipping(false);
        return;
      }
    } catch {
      kToast.error("Error de red al saltar el onboarding. Intenta de nuevo.");
      setSkipping(false);
      return;
    }
    try {
      localStorage.removeItem("kronos_wizard_state");
    } catch {
      // ignore
    }
    router.push("/atleta");
    router.refresh();
  }

  async function finishWithAnimation() {
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
        setShowPlanCreating(false);
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

  if (showPlanCreating) {
    return <PlanCreatingScreen onComplete={finishWithAnimation} />;
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

      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-center text-[11px]" style={{ color: "var(--k-t3)" }}>
          Puedes cambiar todo después desde tu perfil.
        </p>
        <button
          type="button"
          onClick={handleSkip}
          disabled={skipping || pending}
          className="text-xs underline disabled:opacity-40"
          style={{ color: "var(--k-t3)" }}
        >
          {skipping ? "Cargando..." : "Saltar por ahora"}
        </button>
      </div>
    </div>
  );
}
