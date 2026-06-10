"use client";

import { NumberStepper, CheckboxCard } from "@/components/kronos/forms";
import type { BiologicalSex } from "@prisma/client";

type Step2PhysicalProfileProps = {
  biologicalSex: BiologicalSex | null;
  weightKg: number | null;
  ageYears: number | null;
  heightCm: number | null;
  trackMenstrualCycle: boolean;
  onBiologicalSexChange: (sex: BiologicalSex) => void;
  onWeightChange: (weight: number) => void;
  onAgeChange: (age: number) => void;
  onHeightChange: (height: number) => void;
  onMenstrualCycleChange: (tracked: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step2PhysicalProfile({
  biologicalSex,
  weightKg,
  ageYears,
  heightCm,
  trackMenstrualCycle,
  onBiologicalSexChange,
  onWeightChange,
  onAgeChange,
  onHeightChange,
  onMenstrualCycleChange,
  onPrev,
  onNext,
  pending,
}: Step2PhysicalProfileProps) {
  const canContinue = biologicalSex && weightKg && ageYears && heightCm;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Tu perfil físico
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Información para personalizar tu plan.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {}} // TODO: Implement Apple Health sync in Ola 2
          disabled
          className="w-full px-4 py-3 rounded-xl border flex items-center gap-3 transition-all disabled:opacity-50"
          style={{
            borderColor: "var(--k-line-2)",
            background: "var(--k-surface)",
            color: "var(--k-t2)",
          }}
        >
          <span className="text-lg">🍎</span>
          <div className="text-left flex-1">
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--k-t1)" }}
            >
              Sincronizar con Apple Health
            </div>
            <div className="text-xs" style={{ color: "var(--k-t3)" }}>
              Disponible en iOS app
            </div>
          </div>
        </button>

        <div className="space-y-2">
          <label
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Sexo biológico
          </label>
          <div className="flex gap-2">
            {["MALE", "FEMALE", "OTHER"].map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => onBiologicalSexChange(sex as BiologicalSex)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-all"
                style={{
                  background:
                    biologicalSex === sex ? "var(--k-accent)" : "transparent",
                  borderColor:
                    biologicalSex === sex
                      ? "var(--k-accent)"
                      : "var(--k-line-2)",
                  color:
                    biologicalSex === sex
                      ? "var(--k-accent-on)"
                      : "var(--k-t1)",
                }}
                disabled={pending}
              >
                {sex === "MALE"
                  ? "Hombre"
                  : sex === "FEMALE"
                    ? "Mujer"
                    : "Otro"}
              </button>
            ))}
          </div>
        </div>

        <NumberStepper
          label="Peso (kg)"
          value={weightKg ?? 70}
          onChange={onWeightChange}
          min={30}
          max={200}
          step={1}
        />
        <NumberStepper
          label="Edad (años)"
          value={ageYears ?? 25}
          onChange={onAgeChange}
          min={13}
          max={99}
          step={1}
        />
        <NumberStepper
          label="Altura (cm)"
          value={heightCm ?? 170}
          onChange={onHeightChange}
          min={130}
          max={220}
          step={1}
        />

        {biologicalSex === "FEMALE" && (
          <CheckboxCard
            checked={trackMenstrualCycle}
            onChange={onMenstrualCycleChange}
            label="Hacer seguimiento de ciclo menstrual"
            description="Esto nos ayuda a optimizar tu plan según tu ciclo"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {!biologicalSex && (
          <p className="text-xs text-center" style={{ color: "var(--k-t2)" }}>
            Selecciona tu sexo biológico para continuar
          </p>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue || pending}
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
