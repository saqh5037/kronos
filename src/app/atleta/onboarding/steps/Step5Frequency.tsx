"use client";

import { ChevronLeft, Lightbulb } from "lucide-react";
import { NumberStepper } from "@/components/kronos/forms";
import type { FitnessExperience } from "@prisma/client";

type Step5FrequencyProps = {
  frequency: number | null;
  experience: FitnessExperience | null;
  onFrequencyChange: (freq: number) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

function getRecommendedFrequency(experience: FitnessExperience | null): number {
  if (experience === "NONE" || experience === "BEGINNER") return 3;
  if (experience === "INTERMEDIATE") return 4;
  return 5; // ADVANCED
}

export function Step5Frequency({
  frequency,
  experience,
  onFrequencyChange,
  onPrev,
  onNext,
  pending,
}: Step5FrequencyProps) {
  const recommended = getRecommendedFrequency(experience);
  const displayFrequency = frequency ?? recommended;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          ¿Cuántos días por semana?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Frecuencia de entrenamiento semanal.
        </p>
      </div>

      {experience && (
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            background: "var(--k-surface)",
            borderLeft: "3px solid var(--k-line)",
            color: "var(--k-t1)",
          }}
        >
          <strong>Recomendado para ti:</strong> {recommended} días/semana
        </div>
      )}

      <NumberStepper
        label="Días por semana"
        value={displayFrequency}
        onChange={onFrequencyChange}
        min={1}
        max={7}
        step={1}
      />

      <div className="space-y-1 text-xs" style={{ color: "var(--k-t2)" }}>
        <p className="flex items-start gap-1.5">
          <Lightbulb size={13} aria-hidden className="mt-0.5 shrink-0" />
          Ajusta según tu disponibilidad actual. Puedes cambiar después.
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            // If the user never touched the stepper, commit the displayed
            // recommended value before advancing so the state is non-null.
            if (frequency === null) onFrequencyChange(displayFrequency);
            onNext();
          }}
          disabled={pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={pending}
          className="text-xs underline disabled:opacity-50"
          style={{ color: "var(--k-t3)" }}
        >
          <span className="inline-flex items-center justify-center gap-1">
            <ChevronLeft size={12} aria-hidden />
            Atrás
          </span>
        </button>
      </div>
    </div>
  );
}
