"use client";

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
            background: "var(--k-accent-soft)",
            borderLeft: "3px solid var(--k-accent)",
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
        <p>💡 Ajusta según tu disponibilidad actual. Puedes cambiar después.</p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!frequency || pending}
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
          ← Atrás
        </button>
      </div>
    </div>
  );
}
