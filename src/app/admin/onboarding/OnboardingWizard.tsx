"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBox,
  updateBoxSchedule,
  type BoxSettings,
  type BoxScheduleSettings,
  type WeeklySchedule,
} from "@/server/actions/box";
import {
  createFirstPlan,
  inviteStaff,
  completeOnboarding,
  type OnboardingStatus,
} from "@/server/actions/onboarding";
import {
  SUPPORTED_TIMEZONES,
  SUPPORTED_CURRENCIES,
} from "@/lib/validations/box";
import { PLAN_TYPES, STAFF_ROLES } from "@/lib/validations/onboarding";
import { kToast } from "@/lib/toast";
import KCard from "@/components/kronos/KCard";
import Eyebrow from "@/components/kronos/Eyebrow";

type Props = {
  box: BoxSettings;
  schedule: BoxScheduleSettings;
  status: OnboardingStatus;
};

const STEPS = [
  { n: 1, label: "Box" },
  { n: 2, label: "Horarios" },
  { n: 3, label: "Plan" },
  { n: 4, label: "Equipo" },
  { n: 5, label: "Listo" },
] as const;

const DEFAULT_SCHEDULE: WeeklySchedule = {
  mon: { kind: "WOD", hours: [6, 7, 9, 17, 18, 19] },
  tue: { kind: "WOD", hours: [6, 7, 9, 17, 18, 19] },
  wed: { kind: "WOD", hours: [6, 7, 9, 17, 18, 19] },
  thu: { kind: "WOD", hours: [6, 7, 9, 17, 18, 19] },
  fri: { kind: "WOD", hours: [6, 7, 9, 17, 18, 19] },
  sat: { kind: "OPEN_BOX", hours: [8, 9, 10] },
  sun: null,
};

type InviteRow = { email: string; name: string; role: "COACH" | "STAFF" };

export default function OnboardingWizard({ box, schedule, status }: Props) {
  const router = useRouter();
  const initialStep = status.completedAt
    ? 5
    : status.staffCount > 0
      ? 4
      : status.hasPlan
        ? 4
        : status.hasSchedule
          ? 3
          : 1;
  const [step, setStep] = useState(initialStep);
  const [pending, startTransition] = useTransition();

  // Step 1 — Box config
  const [name, setName] = useState(box.name);
  const [timezone, setTimezone] = useState(box.timezone);
  const [currency, setCurrency] = useState(box.currency);
  const [brandColor, setBrandColor] = useState(box.brandColor ?? "#19f08b");

  // Step 3 — Plan
  const [planName, setPlanName] = useState("Mensualidad");
  const [planType, setPlanType] =
    useState<(typeof PLAN_TYPES)[number]>("MONTHLY");
  const [planPrice, setPlanPrice] = useState("1200");
  const [planClasses, setPlanClasses] = useState("12");

  // Step 4 — Invites
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: "", name: "", role: "COACH" },
  ]);

  function next() {
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  // Submit handlers — all async via startTransition
  function submitStep1() {
    startTransition(async () => {
      try {
        await updateBox({
          name,
          locale: box.locale,
          currency,
          timezone,
          defaultClassCapacity: box.defaultClassCapacity,
          brandColor,
          logoUrl: box.logoUrl ?? "",
        });
        kToast.success("Box actualizado");
        next();
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function submitStep2(useDefault: boolean) {
    startTransition(async () => {
      try {
        await updateBoxSchedule({
          ...schedule,
          weeklySchedule: useDefault
            ? DEFAULT_SCHEDULE
            : schedule.weeklySchedule,
        });
        kToast.success(useDefault ? "Horario aplicado" : "Horario guardado");
        next();
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function submitStep3() {
    startTransition(async () => {
      const result = await createFirstPlan({
        name: planName,
        type: planType,
        price: Number(planPrice),
        classesPerMonth: planClasses ? Number(planClasses) : null,
      });
      if (!result.ok) {
        kToast.error(result.message);
        return;
      }
      kToast.success("Plan creado");
      next();
    });
  }

  function submitStep4() {
    startTransition(async () => {
      const filtered = invites.filter((i) => i.email && i.name);
      if (filtered.length === 0) {
        next();
        return;
      }
      const result = await inviteStaff(filtered);
      if (!result.ok) {
        kToast.error(result.message);
        return;
      }
      const msg =
        result.created > 0
          ? `${result.created} invitación${result.created === 1 ? "" : "es"} creada${result.created === 1 ? "" : "s"}`
          : "Sin invitaciones nuevas";
      if (result.skipped.length > 0) {
        kToast.info(`${msg} · ${result.skipped.length} ya registrados`);
      } else {
        kToast.success(msg);
      }
      next();
    });
  }

  function submitFinish() {
    startTransition(async () => {
      await completeOnboarding();
      kToast.success("¡Listo, tu box está configurado!");
      router.push("/admin");
      router.refresh();
    });
  }

  function addInvite() {
    setInvites([...invites, { email: "", name: "", role: "COACH" }]);
  }

  function updateInvite(idx: number, patch: Partial<InviteRow>) {
    setInvites(invites.map((i, j) => (j === idx ? { ...i, ...patch } : i)));
  }

  function removeInvite(idx: number) {
    setInvites(invites.filter((_, j) => j !== idx));
  }

  return (
    <div>
      <div className="mb-8">
        <Eyebrow color="blue">Onboarding · Paso {step} de 5</Eyebrow>
        <h1 className="mt-3 font-display font-extrabold text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.02em]">
          Configurá tu box en 5 pasos
        </h1>
        <Stepper current={step} />
      </div>

      <KCard animate={false} className="p-6 md:p-8">
        {step === 1 ? (
          <Step1
            name={name}
            setName={setName}
            timezone={timezone}
            setTimezone={setTimezone}
            currency={currency}
            setCurrency={setCurrency}
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            pending={pending}
            onNext={submitStep1}
          />
        ) : null}
        {step === 2 ? (
          <Step2
            pending={pending}
            onApplyDefault={() => submitStep2(true)}
            onSkip={next}
            onBack={back}
            hasSchedule={status.hasSchedule}
          />
        ) : null}
        {step === 3 ? (
          <Step3
            planName={planName}
            setPlanName={setPlanName}
            planType={planType}
            setPlanType={setPlanType}
            planPrice={planPrice}
            setPlanPrice={setPlanPrice}
            planClasses={planClasses}
            setPlanClasses={setPlanClasses}
            currency={currency}
            pending={pending}
            onNext={submitStep3}
            onBack={back}
            onSkip={next}
          />
        ) : null}
        {step === 4 ? (
          <Step4
            invites={invites}
            addInvite={addInvite}
            updateInvite={updateInvite}
            removeInvite={removeInvite}
            pending={pending}
            onNext={submitStep4}
            onBack={back}
            onSkip={next}
          />
        ) : null}
        {step === 5 ? (
          <Step5
            boxName={name}
            pending={pending}
            onFinish={submitFinish}
            onBack={back}
          />
        ) : null}
      </KCard>
    </div>
  );
}

// ───── Stepper ──────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background:
                    active || done ? "var(--k-accent)" : "var(--k-elevated)",
                  color: active || done ? "var(--k-accent-on)" : "var(--k-t3)",
                }}
              >
                {done ? "✓" : s.n}
              </div>
              <span
                className="text-[10px] font-mono uppercase tracking-wider hidden md:inline"
                style={{
                  color: active ? "var(--k-t1)" : "var(--k-t3)",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className="flex-1 h-[2px]"
                style={{
                  background: done ? "var(--k-accent)" : "var(--k-line)",
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ───── Step components ─────────────────────────────────────────────────────

type Step1Props = {
  name: string;
  setName: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  brandColor: string;
  setBrandColor: (v: string) => void;
  pending: boolean;
  onNext: () => void;
};

function Step1(p: Step1Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Empezá por lo básico
        </h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Estos datos van en tu marca, mails y reportes.
        </p>
      </div>
      <Field label="Nombre del box" value={p.name} onChange={p.setName} />
      <div className="grid md:grid-cols-2 gap-4">
        <SelectField
          label="Zona horaria"
          value={p.timezone}
          onChange={p.setTimezone}
          options={SUPPORTED_TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
        />
        <SelectField
          label="Moneda"
          value={p.currency}
          onChange={p.setCurrency}
          options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <div>
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Color de marca
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="color"
            value={p.brandColor}
            onChange={(e) => p.setBrandColor(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border"
            style={{ borderColor: "var(--k-line-2)" }}
          />
          <input
            type="text"
            value={p.brandColor}
            onChange={(e) => p.setBrandColor(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm border font-mono"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
              color: "var(--k-t1)",
            }}
          />
        </div>
      </div>
      <NavRow
        right={
          <button
            onClick={p.onNext}
            disabled={p.pending}
            className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
          >
            {p.pending ? "Guardando…" : "Guardar y continuar"}
          </button>
        }
      />
    </div>
  );
}

type Step2Props = {
  pending: boolean;
  onApplyDefault: () => void;
  onSkip: () => void;
  onBack: () => void;
  hasSchedule: boolean;
};

function Step2(p: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Tu horario operativo
        </h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          {p.hasSchedule
            ? "Ya tenés horarios cargados. Podés ajustarlos en Ajustes → Horarios."
            : "Te dejamos un preset CrossFit-friendly. Podés afinarlo después."}
        </p>
      </div>
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: "var(--k-elevated)" }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--k-t2)" }}>Lun–Vie</span>
          <span className="font-mono">06 · 07 · 09 · 17 · 18 · 19</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--k-t2)" }}>Sábado · Open Box</span>
          <span className="font-mono">08 · 09 · 10</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--k-t2)" }}>Domingo</span>
          <span style={{ color: "var(--k-t3)" }}>cerrado</span>
        </div>
      </div>
      <NavRow
        left={
          <button
            onClick={p.onBack}
            className="text-sm underline"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
        }
        right={
          <div className="flex gap-2">
            <button
              onClick={p.onSkip}
              disabled={p.pending}
              className="px-4 py-2.5 rounded-full font-bold text-sm border disabled:opacity-50"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t2)",
              }}
            >
              Saltar
            </button>
            <button
              onClick={p.onApplyDefault}
              disabled={p.pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {p.pending ? "Aplicando…" : "Aplicar este horario"}
            </button>
          </div>
        }
      />
    </div>
  );
}

type Step3Props = {
  planName: string;
  setPlanName: (v: string) => void;
  planType: (typeof PLAN_TYPES)[number];
  setPlanType: (v: (typeof PLAN_TYPES)[number]) => void;
  planPrice: string;
  setPlanPrice: (v: string) => void;
  planClasses: string;
  setPlanClasses: (v: string) => void;
  currency: string;
  pending: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

function Step3(p: Step3Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Tu primer plan de membresía
        </h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Vas a poder crear más planes desde Pagos. Empezá con uno.
        </p>
      </div>
      <Field
        label="Nombre del plan"
        value={p.planName}
        onChange={p.setPlanName}
      />
      <div className="grid md:grid-cols-2 gap-4">
        <SelectField
          label="Tipo"
          value={p.planType}
          onChange={(v) => p.setPlanType(v as (typeof PLAN_TYPES)[number])}
          options={PLAN_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Field
          label={`Precio (${p.currency})`}
          value={p.planPrice}
          onChange={p.setPlanPrice}
          type="number"
        />
      </div>
      <Field
        label="Clases por mes (opcional)"
        value={p.planClasses}
        onChange={p.setPlanClasses}
        type="number"
        hint="Dejá vacío si es plan ilimitado"
      />
      <NavRow
        left={
          <button
            onClick={p.onBack}
            className="text-sm underline"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
        }
        right={
          <div className="flex gap-2">
            <button
              onClick={p.onSkip}
              className="px-4 py-2.5 rounded-full font-bold text-sm border"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t2)",
              }}
            >
              Saltar
            </button>
            <button
              onClick={p.onNext}
              disabled={p.pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {p.pending ? "Creando…" : "Crear plan"}
            </button>
          </div>
        }
      />
    </div>
  );
}

type Step4Props = {
  invites: InviteRow[];
  addInvite: () => void;
  updateInvite: (idx: number, patch: Partial<InviteRow>) => void;
  removeInvite: (idx: number) => void;
  pending: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

function Step4(p: Step4Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Invitá a tu equipo
        </h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Coaches y staff. Cada uno recibe un email con link para activar su
          cuenta. Atletas se invitan después desde Atletas.
        </p>
      </div>
      <div className="space-y-3">
        {p.invites.map((inv, idx) => (
          <div
            key={idx}
            className="grid md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end"
          >
            <Field
              label={idx === 0 ? "Email" : ""}
              value={inv.email}
              onChange={(v) => p.updateInvite(idx, { email: v })}
              type="email"
            />
            <Field
              label={idx === 0 ? "Nombre" : ""}
              value={inv.name}
              onChange={(v) => p.updateInvite(idx, { name: v })}
            />
            <SelectField
              label={idx === 0 ? "Rol" : ""}
              value={inv.role}
              onChange={(v) =>
                p.updateInvite(idx, { role: v as (typeof STAFF_ROLES)[number] })
              }
              options={STAFF_ROLES.map((r) => ({ value: r, label: r }))}
            />
            <button
              onClick={() => p.removeInvite(idx)}
              className="px-3 py-2.5 rounded-xl border text-sm"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t3)",
              }}
              aria-label="Eliminar fila"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={p.addInvite}
          className="text-sm underline"
          style={{ color: "var(--k-accent)" }}
        >
          + Agregar otro
        </button>
      </div>
      <NavRow
        left={
          <button
            onClick={p.onBack}
            className="text-sm underline"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
        }
        right={
          <div className="flex gap-2">
            <button
              onClick={p.onSkip}
              className="px-4 py-2.5 rounded-full font-bold text-sm border"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t2)",
              }}
            >
              Saltar
            </button>
            <button
              onClick={p.onNext}
              disabled={p.pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {p.pending ? "Guardando…" : "Guardar e ir al final"}
            </button>
          </div>
        }
      />
    </div>
  );
}

type Step5Props = {
  boxName: string;
  pending: boolean;
  onFinish: () => void;
  onBack: () => void;
};

function Step5(p: Step5Props) {
  return (
    <div className="space-y-5 text-center">
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto"
        style={{ background: "var(--k-accent-soft)" }}
      >
        <span
          className="font-display font-bold text-2xl"
          style={{ color: "var(--k-accent)" }}
        >
          ✓
        </span>
      </div>
      <h2 className="font-display font-bold text-2xl">
        Tu box <em>{p.boxName}</em> está listo
      </h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--k-t2)" }}>
        Podés afinar todo desde Ajustes cuando quieras. Llevate tu trial al
        máximo: cargá WODs, anunciá clases y empezá a operar.
      </p>
      <NavRow
        left={
          <button
            onClick={p.onBack}
            className="text-sm underline"
            style={{ color: "var(--k-t3)" }}
          >
            ← Atrás
          </button>
        }
        right={
          <button
            onClick={p.onFinish}
            disabled={p.pending}
            className="k-btn-grad px-6 py-3 rounded-full font-bold text-sm disabled:opacity-50"
          >
            {p.pending ? "Cerrando…" : "Ir al dashboard →"}
          </button>
        }
      />
    </div>
  );
}

// ───── Reusable mini form helpers ──────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
};

function Field({ label, value, onChange, type = "text", hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          {label}
        </label>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      {hint ? (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--k-t3)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
};

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          {label}
        </label>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NavRow({
  left,
  right,
}: {
  left?: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center pt-2">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
