"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import KCard from "@/components/kronos/KCard";
import { kToast } from "@/lib/toast";
import {
  completeOnboarding,
  markOnboardingCompleted,
} from "@/server/actions/atleta-onboarding";
import type { Unit, Level } from "@/lib/atleta-prefs";

type Props = {
  initialFirstName: string;
  initialLastName: string;
  initialUnit: Unit | null;
  initialLevel: Level | null;
};

const TOTAL_STEPS = 3;

export default function OnboardingWizard({
  initialFirstName,
  initialLastName,
  initialUnit,
  initialLevel,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [unit, setUnit] = useState<Unit>(initialUnit ?? "kg");
  const [level, setLevel] = useState<Level>(initialLevel ?? "scaled");
  const [joinSlug, setJoinSlug] = useState("");
  const [pending, startTransition] = useTransition();

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function finish(joinSlugOverride?: string | null) {
    startTransition(async () => {
      const result = await completeOnboarding({
        firstName,
        lastName,
        unit,
        level,
        joinBoxSlug: joinSlugOverride ?? (joinSlug.trim() || null),
      });
      if (!result.ok) {
        kToast.error(result.message);
        return;
      }
      if (result.joinedBoxRequested && result.joinBoxName) {
        kToast.success(`Le avisamos al coach de ${result.joinBoxName}`);
      } else {
        kToast.success("¡Listo! Bienvenido a Kronos");
      }
      router.push("/atleta");
      router.refresh();
    });
  }

  function skipAll() {
    startTransition(async () => {
      const r = await markOnboardingCompleted();
      if (r.ok) {
        router.push("/atleta");
        router.refresh();
      } else {
        kToast.error(r.message);
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <p
          className="font-mono text-[11px] uppercase tracking-wider mb-2"
          style={{ color: "var(--k-t3)" }}
        >
          Paso {step} de {TOTAL_STEPS}
        </p>
        <ProgressBar step={step} total={TOTAL_STEPS} />
      </div>

      <KCard animate={false}>
        <div className="p-6">
          {step === 1 ? (
            <Step1
              firstName={firstName}
              lastName={lastName}
              setFirstName={setFirstName}
              setLastName={setLastName}
              onNext={next}
              onSkip={skipAll}
              pending={pending}
            />
          ) : null}
          {step === 2 ? (
            <Step2
              unit={unit}
              level={level}
              setUnit={setUnit}
              setLevel={setLevel}
              onPrev={prev}
              onNext={next}
              onSkip={skipAll}
              pending={pending}
            />
          ) : null}
          {step === 3 ? (
            <Step3
              joinSlug={joinSlug}
              setJoinSlug={setJoinSlug}
              onPrev={prev}
              onFinish={() => finish()}
              onSkipBox={() => finish(null)}
              pending={pending}
            />
          ) : null}
        </div>
      </KCard>

      <p
        className="text-center text-[11px] mt-4"
        style={{ color: "var(--k-t3)" }}
      >
        Podés cambiar todo después desde tu perfil.
      </p>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "var(--k-line)" }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: "var(--k-accent)",
          boxShadow: "var(--k-accent-glow)",
        }}
      />
    </div>
  );
}

type Step1Props = {
  firstName: string;
  lastName: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  pending: boolean;
};

function Step1({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  onNext,
  onSkip,
  pending,
}: Step1Props) {
  const canContinue = firstName.trim().length >= 2;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Bienvenido
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          ¿Cómo querés que te llamemos?
        </p>
      </div>
      <Field
        label="Nombre"
        value={firstName}
        onChange={setFirstName}
        placeholder="Tu nombre"
        required
      />
      <Field
        label="Apellido (opcional)"
        value={lastName}
        onChange={setLastName}
        placeholder=""
      />
      <div className="flex flex-col gap-2 pt-2">
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
          onClick={onSkip}
          disabled={pending}
          className="text-xs underline disabled:opacity-50"
          style={{ color: "var(--k-t3)" }}
        >
          Saltar y empezar
        </button>
      </div>
    </div>
  );
}

type Step2Props = {
  unit: Unit;
  level: Level;
  setUnit: (v: Unit) => void;
  setLevel: (v: Level) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  pending: boolean;
};

function Step2({
  unit,
  level,
  setUnit,
  setLevel,
  onPrev,
  onNext,
  onSkip,
  pending,
}: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Tus preferencias
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          ¿En qué unidad medís y a qué nivel entrenás?
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Unidad
        </label>
        <SegmentedControl
          options={[
            { value: "kg", label: "Kilogramos" },
            { value: "lb", label: "Libras" },
          ]}
          value={unit}
          onChange={(v) => setUnit(v as Unit)}
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Nivel
        </label>
        <SegmentedControl
          options={[
            { value: "beginner", label: "Empezando" },
            { value: "scaled", label: "Scaled" },
            { value: "rx", label: "RX" },
          ]}
          value={level}
          onChange={(v) => setLevel(v as Level)}
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            disabled={pending}
            className="text-xs underline disabled:opacity-50"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={pending}
            className="text-xs underline disabled:opacity-50"
            style={{ color: "var(--k-t3)" }}
          >
            Saltar y empezar
          </button>
        </div>
      </div>
    </div>
  );
}

type Step3Props = {
  joinSlug: string;
  setJoinSlug: (v: string) => void;
  onPrev: () => void;
  onFinish: () => void;
  onSkipBox: () => void;
  pending: boolean;
};

function Step3({
  joinSlug,
  setJoinSlug,
  onPrev,
  onFinish,
  onSkipBox,
  pending,
}: Step3Props) {
  const hasSlug = joinSlug.trim().length > 0;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          ¿Tenés un box?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Si tu coach te dio un código, lo podés ingresar acá. Si no, podés
          empezar solo y unirte después.
        </p>
      </div>

      <Field
        label="Código del box (opcional)"
        value={joinSlug}
        onChange={(v) => setJoinSlug(v.toLowerCase())}
        placeholder="ej: iron-hands"
        autoComplete="off"
      />
      <p className="text-[11px] -mt-3" style={{ color: "var(--k-t3)" }}>
        Le mandamos un email al coach para que te apruebe.
      </p>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onFinish}
          disabled={pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {hasSlug
            ? pending
              ? "Mandando solicitud…"
              : "Solicitar unirme y empezar"
            : pending
              ? "Empezando…"
              : "Empezar sin box"}
        </button>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            disabled={pending}
            className="text-xs underline disabled:opacity-50"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={onSkipBox}
            disabled={pending}
            className="text-xs underline disabled:opacity-50"
            style={{ color: "var(--k-t3)" }}
          >
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
    </div>
  );
}

type SegmentedOption = { value: string; label: string };

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{ background: "var(--k-surface)", border: "1px solid var(--k-line-2)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
            style={{
              background: active ? "var(--k-accent)" : "transparent",
              color: active ? "var(--k-accent-on)" : "var(--k-t2)",
              fontWeight: active ? 700 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
