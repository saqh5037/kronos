"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBox,
  updateBoxSchedule,
  type BoxSettings,
  type BoxScheduleSettings,
  type DaySchedule,
  type WeeklySchedule,
} from "@/server/actions/box";
import {
  createFirstPlan,
  inviteStaff,
  completeOnboarding,
  type OnboardingStatus,
} from "@/server/actions/onboarding";
import { importBenchmarkWods } from "@/server/actions/wod-presets";
import {
  DEFAULT_WOD_SLUGS,
  type BenchmarkWodOption,
} from "@/lib/wod-presets-data";
import {
  SUPPORTED_TIMEZONES,
  SUPPORTED_CURRENCIES,
} from "@/lib/validations/box";
import { PLAN_TYPES, STAFF_ROLES } from "@/lib/validations/onboarding";
import { kToast } from "@/lib/toast";
import KCard from "@/components/kronos/KCard";
import Eyebrow from "@/components/kronos/Eyebrow";
import { LogoUpload } from "@/components/admin/LogoUpload";

type Props = {
  box: BoxSettings;
  schedule: BoxScheduleSettings;
  status: OnboardingStatus;
  wodPresets: BenchmarkWodOption[];
};

const STEPS = [
  { n: 1, label: "Box" },
  { n: 2, label: "Horarios" },
  { n: 3, label: "WODs" },
  { n: 4, label: "Plan" },
  { n: 5, label: "Equipo" },
  { n: 6, label: "Listo" },
] as const;

const TOTAL_STEPS = STEPS.length;

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

export default function OnboardingWizard({
  box,
  schedule,
  status,
  wodPresets,
}: Props) {
  const router = useRouter();
  // Step indices: 1=Box, 2=Horarios, 3=WODs, 4=Plan, 5=Equipo, 6=Listo
  const initialStep = status.completedAt
    ? TOTAL_STEPS
    : status.staffCount > 0
      ? 5
      : status.hasPlan
        ? 5
        : status.hasSchedule
          ? 3
          : 1;
  const [step, setStep] = useState(initialStep);
  const [pending, startTransition] = useTransition();

  // Step 1 — Box config
  const [name, setName] = useState(box.name);
  const [timezone, setTimezone] = useState(box.timezone);
  const [currency, setCurrency] = useState(box.currency);
  const [brandColor, setBrandColor] = useState(box.brandColor ?? "#c8ff2d");
  const [logoUrl, setLogoUrl] = useState<string | null>(box.logoUrl ?? null);

  // Step 2 — Weekly schedule (editable)
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
    () => schedule.weeklySchedule ?? DEFAULT_SCHEDULE,
  );

  // Step 3 — Plan
  const [planName, setPlanName] = useState("Mensualidad");
  const [planType, setPlanType] =
    useState<(typeof PLAN_TYPES)[number]>("MONTHLY");
  const [planPrice, setPlanPrice] = useState("1200");
  const [planClasses, setPlanClasses] = useState("12");

  // Step 3 — WOD presets
  const [selectedWods, setSelectedWods] = useState<Set<string>>(
    () => new Set(DEFAULT_WOD_SLUGS),
  );

  // Step 5 — Invites
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: "", name: "", role: "COACH" },
  ]);

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
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
          logoUrl: logoUrl ?? "",
        });
        kToast.success("Box actualizado");
        next();
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function submitStep2() {
    startTransition(async () => {
      try {
        await updateBoxSchedule({
          ...schedule,
          weeklySchedule,
        });
        kToast.success("Horario guardado");
        next();
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function resetSchedulePreset() {
    setWeeklySchedule(DEFAULT_SCHEDULE);
    kToast.info("Preset CrossFit aplicado");
  }

  function setDayKind(key: keyof WeeklySchedule, kind: "WOD" | "OPEN_BOX") {
    setWeeklySchedule((s) => {
      const day = s[key];
      if (!day) return s;
      return { ...s, [key]: { ...day, kind } };
    });
  }

  function toggleDayOpen(key: keyof WeeklySchedule) {
    setWeeklySchedule((s) => {
      if (s[key]) return { ...s, [key]: null };
      return { ...s, [key]: { kind: "WOD" as const, hours: [] } };
    });
  }

  function toggleHour(key: keyof WeeklySchedule, hour: number) {
    setWeeklySchedule((s) => {
      const day = s[key];
      const current: DaySchedule = day ?? { kind: "WOD", hours: [] };
      const has = current.hours.includes(hour);
      const newHours = has
        ? current.hours.filter((h) => h !== hour)
        : [...current.hours, hour].sort((a, b) => a - b);
      return {
        ...s,
        [key]: newHours.length === 0 ? null : { ...current, hours: newHours },
      };
    });
  }

  function submitStep3() {
    startTransition(async () => {
      const wodSlugs = Array.from(selectedWods);
      if (wodSlugs.length === 0) {
        next();
        return;
      }
      const result = await importBenchmarkWods({ wodSlugs });
      if (!result.ok) {
        kToast.error(result.message);
        return;
      }
      const msg =
        result.created > 0
          ? `${result.created} WOD${result.created === 1 ? "" : "s"} importado${result.created === 1 ? "" : "s"}`
          : "Sin WODs nuevos";
      if (result.skipped.length > 0) {
        kToast.info(`${msg} · ${result.skipped.length} omitidos`);
      } else {
        kToast.success(msg);
      }
      next();
    });
  }

  function submitStep4() {
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

  function submitStep5() {
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

  function toggleWod(slug: string) {
    setSelectedWods((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
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
        <Eyebrow color="blue">
          Onboarding · Paso {step} de {TOTAL_STEPS}
        </Eyebrow>
        <h1 className="mt-3 font-display font-extrabold text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.02em]">
          Configura tu box en {TOTAL_STEPS} pasos
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
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            pending={pending}
            onNext={submitStep1}
          />
        ) : null}
        {step === 2 ? (
          <Step2
            weeklySchedule={weeklySchedule}
            onToggleDayOpen={toggleDayOpen}
            onSetDayKind={setDayKind}
            onToggleHour={toggleHour}
            onResetPreset={resetSchedulePreset}
            pending={pending}
            onSave={submitStep2}
            onSkip={next}
            onBack={back}
            hasSchedule={status.hasSchedule}
          />
        ) : null}
        {step === 3 ? (
          <StepWods
            presets={wodPresets}
            selected={selectedWods}
            onToggle={toggleWod}
            pending={pending}
            onNext={submitStep3}
            onBack={back}
            onSkip={next}
          />
        ) : null}
        {step === 4 ? (
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
            onNext={submitStep4}
            onBack={back}
            onSkip={next}
          />
        ) : null}
        {step === 5 ? (
          <Step4
            invites={invites}
            addInvite={addInvite}
            updateInvite={updateInvite}
            removeInvite={removeInvite}
            pending={pending}
            onNext={submitStep5}
            onBack={back}
            onSkip={next}
          />
        ) : null}
        {step === 6 ? (
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
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  pending: boolean;
  onNext: () => void;
};

function Step1(p: Step1Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Empieza por lo básico
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
      <div>
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Logo (opcional)
        </label>
        <div className="mt-2">
          <LogoUpload
            currentUrl={p.logoUrl}
            onUploaded={(url) => p.setLogoUrl(url)}
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
  weeklySchedule: WeeklySchedule;
  onToggleDayOpen: (key: keyof WeeklySchedule) => void;
  onSetDayKind: (key: keyof WeeklySchedule, kind: "WOD" | "OPEN_BOX") => void;
  onToggleHour: (key: keyof WeeklySchedule, hour: number) => void;
  onResetPreset: () => void;
  pending: boolean;
  onSave: () => void;
  onSkip: () => void;
  onBack: () => void;
  hasSchedule: boolean;
};

const DOW_LABELS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const STEP2_HOURS = Array.from({ length: 24 }, (_, i) => i);

function Step2(p: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Tu horario operativo
        </h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          {p.hasSchedule
            ? "Ajusta cada día. Marca/desmarca horas, elige WOD u Open Box, o cierra el día."
            : "Empezamos con un preset CrossFit-friendly. Ajusta cada día a tu medida."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className="font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Leyenda:
        </span>
        <span
          className="px-2 py-0.5 rounded font-mono font-bold"
          style={{
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
          }}
        >
          WOD
        </span>
        <span
          className="px-2 py-0.5 rounded font-mono font-bold"
          style={{
            background: "var(--k-warning)",
            color: "var(--k-accent-on)",
          }}
        >
          OPEN BOX
        </span>
        <span style={{ color: "var(--k-t3)" }}>
          · click en hora para agregar/quitar
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {DOW_LABELS.map(({ key, label }) => {
          const day = p.weeklySchedule[key];
          return (
            <div
              key={key}
              className="rounded-xl p-3 border"
              style={{
                background: day ? "var(--k-elevated)" : "transparent",
                borderColor: "var(--k-line-2)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!day}
                      onChange={() => p.onToggleDayOpen(key)}
                      style={{ accentColor: "var(--k-accent)" }}
                    />
                    <span className="font-display text-sm font-bold">
                      {label}
                    </span>
                  </label>
                  {!day ? (
                    <span className="text-xs" style={{ color: "var(--k-t3)" }}>
                      cerrado
                    </span>
                  ) : null}
                </div>
                {day ? (
                  <div className="flex gap-1">
                    <Step2KindToggle
                      active={day.kind === "WOD"}
                      onClick={() => p.onSetDayKind(key, "WOD")}
                    >
                      WOD
                    </Step2KindToggle>
                    <Step2KindToggle
                      active={day.kind === "OPEN_BOX"}
                      onClick={() => p.onSetDayKind(key, "OPEN_BOX")}
                    >
                      Open Box
                    </Step2KindToggle>
                  </div>
                ) : null}
              </div>
              {day ? (
                <div className="flex flex-wrap gap-1.5">
                  {STEP2_HOURS.map((h) => {
                    const on = day.hours.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => p.onToggleHour(key, h)}
                        className="font-mono text-[11px] font-bold rounded-md transition-all"
                        style={{
                          width: 38,
                          height: 30,
                          background: on
                            ? day.kind === "OPEN_BOX"
                              ? "var(--k-warning)"
                              : "var(--k-accent)"
                            : "var(--k-elevated)",
                          color: on ? "var(--k-accent-on)" : "var(--k-t3)",
                          border: `1px solid ${on ? "transparent" : "var(--k-line)"}`,
                          cursor: "pointer",
                        }}
                        aria-pressed={on}
                        aria-label={`${label} ${String(h).padStart(2, "0")}:00`}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={p.onResetPreset}
          className="text-xs underline"
          style={{ color: "var(--k-t3)" }}
        >
          ↺ Volver al preset CrossFit
        </button>
        <p className="text-[11px]" style={{ color: "var(--k-t3)" }}>
          Puedes afinarlo después en Ajustes → Horarios.
        </p>
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
              onClick={p.onSave}
              disabled={p.pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {p.pending ? "Guardando…" : "Guardar y continuar"}
            </button>
          </div>
        }
      />
    </div>
  );
}

function Step2KindToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all"
      style={{
        background: active ? "var(--k-surface)" : "transparent",
        color: active ? "var(--k-t1)" : "var(--k-t3)",
        border: `1px solid ${active ? "var(--k-line-2)" : "var(--k-line)"}`,
        cursor: "pointer",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

type StepWodsProps = {
  presets: BenchmarkWodOption[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
  pending: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

function StepWods(p: StepWodsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">WODs benchmark</h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Importa los WODs clásicos para arrancar con biblioteca cargada.
          Después puedes crear los tuyos. Marca los que quieras.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {p.presets.map((wod) => {
          const checked = p.selected.has(wod.slug);
          return (
            <label
              key={wod.slug}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{
                background: checked
                  ? "var(--k-accent-soft)"
                  : "var(--k-elevated)",
                border: `1px solid ${checked ? "var(--k-accent-line)" : "var(--k-line)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => p.onToggle(wod.slug)}
                className="mt-1"
                style={{ accentColor: "var(--k-accent)" }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display font-bold text-sm">
                    {wod.name}
                  </span>
                  <span
                    className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--k-line)",
                      color: "var(--k-t2)",
                    }}
                  >
                    {wod.type}
                  </span>
                </div>
                <p
                  className="text-xs mt-1 truncate"
                  style={{ color: "var(--k-t3)" }}
                >
                  {wod.movements.join(" · ")}
                </p>
              </div>
            </label>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: "var(--k-t3)" }}>
        {p.selected.size} de {p.presets.length} seleccionados.
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
              onClick={p.onNext}
              disabled={p.pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {p.pending ? "Importando…" : "Importar seleccionados"}
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
          Vas a poder crear más planes desde Pagos. Empieza con uno.
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
        hint="Deja vacío si es plan ilimitado"
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
        Puedes afinar todo desde Ajustes cuando quieras. Llévate tu trial al
        máximo: carga WODs, anuncia clases y empieza a operar.
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
