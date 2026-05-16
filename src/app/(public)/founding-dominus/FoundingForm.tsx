"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { reserveFoundingPlan } from "@/server/actions/founding-dominus";
import { slugify } from "@/lib/slug";
import { kToast } from "@/lib/toast";
import type {
  BillingCycle,
  FoundingDisciplineSlugType,
} from "@/lib/validations/founding-dominus";

type FieldErrors = Partial<
  Record<"email" | "ownerName" | "boxName" | "slug" | "phone", string>
>;

type SuccessState = {
  email: string;
  slug: string;
  trialEndsAt: Date;
  billingCycle: BillingCycle;
};

const PRICE_MXN_MONTHLY = 3500;
const PRICE_MXN_ANNUAL = PRICE_MXN_MONTHLY * 12;

function formatMxn(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FoundingForm({
  defaultDiscipline = "crossfit",
}: {
  defaultDiscipline?: FoundingDisciplineSlugType;
} = {}) {
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [boxName, setBoxName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [disciplineSlug, setDisciplineSlug] =
    useState<FoundingDisciplineSlugType>(defaultDiscipline);
  const [website, setWebsite] = useState(""); // honeypot — debe quedar vacío
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();

  function onBoxNameChange(value: string) {
    setBoxName(value);
    if (!slugTouched) setSlug(slugify(value).slice(0, 40));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await reserveFoundingPlan({
        email,
        ownerName,
        boxName,
        slug,
        billingCycle,
        disciplineSlug,
        phone,
        website,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        kToast.error(result.message);
        return;
      }
      try {
        await signIn("email", { email, redirect: false });
      } catch {
        // Fallback silencioso — el email de confirmación ya se envió desde el server
      }
      setSuccess({
        email: result.email,
        slug: result.slug,
        trialEndsAt: result.trialEndsAt,
        billingCycle: result.billingCycle,
      });
    });
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full"
          style={{ background: "var(--k-accent-soft)" }}
        >
          <span
            className="font-display font-bold text-xl"
            style={{ color: "var(--k-accent)" }}
          >
            ✓
          </span>
        </div>
        <h2 className="font-display font-bold text-xl">Reserva confirmada</h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Te llegaron 2 correos a{" "}
          <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>: la
          confirmación de tu Founding Box y el magic link para entrar.
        </p>
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "var(--k-elevated)", color: "var(--k-t3)" }}
        >
          Box: <strong>{success.slug}</strong> · Trial hasta{" "}
          {success.trialEndsAt.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          ·{" "}
          <strong>
            {success.billingCycle === "annual"
              ? "Anual (15 meses)"
              : "Mensual (lock 12)"}
          </strong>
        </div>
        <p className="text-xs" style={{ color: "var(--k-t3)" }}>
          ¿No te llegaron los correos en 5 min? Revisa spam o escríbenos a{" "}
          <a
            href="mailto:contacto@kronos-fit.com"
            className="underline"
            style={{ color: "var(--k-accent)" }}
          >
            contacto@kronos-fit.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot — invisible al usuario, bot-trap. Si se rellena, server
          devuelve fake-success sin escribir DB. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="website">
          Sitio web (no llenar):
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Disciplina principal de tu Box
        </label>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Disciplina principal"
        >
          <DisciplineOption
            active={disciplineSlug === "crossfit"}
            label="CrossFit"
            sublabel="Box CrossFit clásico"
            onClick={() => setDisciplineSlug("crossfit")}
          />
          <DisciplineOption
            active={disciplineSlug === "hyrox"}
            label="Hyrox"
            sublabel="Race format + stations"
            onClick={() => setDisciplineSlug("hyrox")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Modalidad de cobro (lockeado 12 meses)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <CycleOption
            active={billingCycle === "monthly"}
            label="Mensual"
            price={`${formatMxn(PRICE_MXN_MONTHLY)}/mes`}
            badge="Lock 12 meses"
            onClick={() => setBillingCycle("monthly")}
          />
          <CycleOption
            active={billingCycle === "annual"}
            label="Anual"
            price={`${formatMxn(PRICE_MXN_ANNUAL)} upfront`}
            badge="3 meses gratis"
            highlight
            onClick={() => setBillingCycle("annual")}
          />
        </div>
        <p className="text-[11px]" style={{ color: "var(--k-t3)" }}>
          {billingCycle === "annual"
            ? "Pagas 12, recibes 15 meses. El cargo se procesa cuando MercadoPago esté listo (te avisamos por correo)."
            : "Pagas mes a mes al precio fundador, sin aumentos durante 12 meses."}
        </p>
      </div>

      <Field
        label="Email del owner"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="tu@email.com"
        error={errors.email}
        autoComplete="email"
        required
      />
      <Field
        label="Tu nombre"
        name="ownerName"
        type="text"
        value={ownerName}
        onChange={setOwnerName}
        placeholder="Nombre completo"
        error={errors.ownerName}
        autoComplete="name"
        required
      />
      <Field
        label="Nombre del Box"
        name="boxName"
        type="text"
        value={boxName}
        onChange={onBoxNameChange}
        placeholder="Iron Hands CrossFit"
        error={errors.boxName}
        required
      />
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Slug (URL única)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="iron-hands"
          required
          className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
          style={{
            background: "var(--k-surface)",
            borderColor: errors.slug ? "var(--k-danger)" : "var(--k-line-2)",
            color: "var(--k-t1)",
          }}
        />
        <p
          className="text-[11px] mt-0.5"
          style={{
            color: errors.slug ? "var(--k-danger)" : "var(--k-t3)",
          }}
        >
          {errors.slug ??
            "kronos-fit.com/[slug]. Solo minúsculas, números y guiones."}
        </p>
      </div>
      <Field
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="55 1234 5678"
        error={errors.phone}
        autoComplete="tel"
      />

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
      >
        {pending ? "Reservando…" : "Reservar mi Founding Box"}
      </button>

      <p
        className="text-center text-[11px] mt-1"
        style={{ color: "var(--k-t3)" }}
      >
        Sin cargo hoy. El pago se procesa cuando enchufemos MercadoPago — el
        precio queda lockeado.
      </p>
    </form>
  );
}

type CycleOptionProps = {
  active: boolean;
  label: string;
  price: string;
  badge: string;
  highlight?: boolean;
  onClick: () => void;
};

function CycleOption({
  active,
  label,
  price,
  badge,
  highlight,
  onClick,
}: CycleOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left px-4 py-3 rounded-xl border transition-colors"
      style={{
        background: active ? "var(--k-accent-soft)" : "var(--k-surface)",
        borderColor: active ? "var(--k-accent)" : "var(--k-line-2)",
        color: "var(--k-t1)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-bold text-sm">{label}</span>
        <span
          className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background: highlight ? "var(--k-accent)" : "var(--k-elevated)",
            color: highlight ? "var(--k-accent-on)" : "var(--k-t2)",
          }}
        >
          {badge}
        </span>
      </div>
      <div className="text-xs mt-1 font-mono" style={{ color: "var(--k-t2)" }}>
        {price}
      </div>
    </button>
  );
}

type DisciplineOptionProps = {
  active: boolean;
  label: string;
  sublabel: string;
  onClick: () => void;
};

function DisciplineOption({
  active,
  label,
  sublabel,
  onClick,
}: DisciplineOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      className="text-left px-4 py-3 rounded-xl border transition-colors"
      style={{
        background: active ? "var(--k-accent-soft)" : "var(--k-surface)",
        borderColor: active ? "var(--k-accent)" : "var(--k-line-2)",
        color: "var(--k-t1)",
      }}
    >
      <div className="font-display font-bold text-sm">{label}</div>
      <div className="text-[11px] mt-0.5" style={{ color: "var(--k-t2)" }}>
        {sublabel}
      </div>
    </button>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
};

function Field({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  required,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-surface)",
          borderColor: error ? "var(--k-danger)" : "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      {error ? (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
