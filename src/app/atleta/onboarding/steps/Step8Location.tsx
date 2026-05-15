"use client";

import { RadioCard } from "@/components/kronos/forms";
import type { TrainingLocation } from "@prisma/client";

type Step8LocationProps = {
  isB2B: boolean;
  boxName: string;
  coachName: string | null;
  trainingLocation: TrainingLocation | null;
  trainsOnOwnToo: boolean;
  onLocationChange: (location: TrainingLocation) => void;
  onTrainsOwnChange: (trainsOwn: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step8Location({
  isB2B,
  boxName,
  coachName,
  trainingLocation,
  trainsOnOwnToo,
  onLocationChange,
  onTrainsOwnChange,
  onPrev,
  onNext,
  pending,
}: Step8LocationProps) {
  if (isB2B) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
            Tu lugar de entrenamiento
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            Personalizamos según dónde entrenas.
          </p>
        </div>

        <div
          className="px-3 py-3 rounded-lg border"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
          }}
        >
          <p className="text-sm font-semibold">
            Entrenas en <strong>{boxName}</strong>
            {coachName && ` · Coach: ${coachName}`}
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={trainsOnOwnToo}
              onChange={(e) => onTrainsOwnChange(e.target.checked)}
              disabled={pending}
              className="mt-1 w-5 h-5 rounded accent-lime-400 disabled:opacity-50"
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--k-t1)" }}
            >
              También entreno solo
            </span>
          </label>
        </div>

        {trainsOnOwnToo && (
          <div className="space-y-3 pt-2">
            <p className="text-xs" style={{ color: "var(--k-t2)" }}>
              ¿Dónde entrenas cuando no estás en {boxName}?
            </p>
            <RadioCard
              selected={trainingLocation === "BIG_GYM"}
              onChange={(selected) => selected && onLocationChange("BIG_GYM")}
              label="Gym grande"
              description="Equipado con múltiples estaciones"
            />
            <RadioCard
              selected={trainingLocation === "SMALL_GYM"}
              onChange={(selected) => selected && onLocationChange("SMALL_GYM")}
              label="Gym pequeño"
              description="Espacio reducido o local"
            />
            <RadioCard
              selected={trainingLocation === "HOME"}
              onChange={(selected) => selected && onLocationChange("HOME")}
              label="Casa"
              description="Entreno desde mi hogar"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onNext}
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
            ← Atrás
          </button>
        </div>
      </div>
    );
  }

  // B2C flow: 3 radios directos
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          ¿Dónde entrenas?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Personaliza tu plan según tu espacio.
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          selected={trainingLocation === "BIG_GYM"}
          onChange={(selected) => selected && onLocationChange("BIG_GYM")}
          label="Gym grande"
          description="Equipado con múltiples estaciones"
        />
        <RadioCard
          selected={trainingLocation === "SMALL_GYM"}
          onChange={(selected) => selected && onLocationChange("SMALL_GYM")}
          label="Gym pequeño"
          description="Espacio reducido o local"
        />
        <RadioCard
          selected={trainingLocation === "HOME"}
          onChange={(selected) => selected && onLocationChange("HOME")}
          label="Casa"
          description="Entreno desde mi hogar"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!trainingLocation || pending}
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
