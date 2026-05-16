"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import {
  checkEmailExists,
  createIndependentAthlete,
} from "@/server/actions/atleta-signup";
import { kToast } from "@/lib/toast";
import { detectPwaPlatform } from "@/lib/pwa-detect";
import MagicLinkWaiting from "@/components/auth/MagicLinkWaiting";
import {
  FITNESS_GOAL_TAGS,
  FITNESS_GOAL_LABEL,
  type FitnessGoalTag,
} from "@/lib/validations/athlete";

type FieldErrors = Partial<
  Record<"email" | "firstName" | "lastName" | "password", string>
>;

type SuccessState = {
  email: string;
  hasPassword: boolean;
  existingUser: boolean;
};

type Phase = "email" | "details" | "goals";

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

type Props = {
  initialEmail?: string;
};

export default function AtletaSignupForm({ initialEmail = "" }: Props) {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();
  const [isIos, setIsIos] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<FitnessGoalTag[]>([]);

  useEffect(() => {
    const platform = detectPwaPlatform(navigator.userAgent);
    const ios = platform === "ios-safari" || platform === "ios-other";
    setIsIos(ios);
    if (ios) setUsePassword(true);
  }, []);

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const r = await checkEmailExists(email);
      if (!r.ok) {
        setErrors({ email: r.message });
        return;
      }
      if (r.exists) {
        // Usuario ya existe → magic link directo, sin pedir nombre/apellido.
        try {
          await signIn("email", { email: r.email, redirect: false });
        } catch {
          // best-effort
        }
        setSuccess({
          email: r.email,
          hasPassword: false,
          existingUser: true,
        });
        return;
      }
      // Cuenta nueva → revelar campos de detalle.
      setEmail(r.email);
      setPhase("details");
    });
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    // Defer the actual create until the goals step. This keeps the goals
    // optional but ensures the tags land in Athlete.tags from the start.
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setErrors({
        firstName:
          firstName.trim().length < 2 ? "Mínimo 2 caracteres" : undefined,
        lastName:
          lastName.trim().length < 2 ? "Mínimo 2 caracteres" : undefined,
      });
      return;
    }
    setPhase("goals");
  }

  function submitWithGoals(goals: FitnessGoalTag[]) {
    startTransition(async () => {
      const result = await createIndependentAthlete({
        email,
        firstName,
        lastName,
        password: usePassword && password.length > 0 ? password : undefined,
        fitnessGoals: goals.length > 0 ? goals : undefined,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        kToast.error(result.message);
        return;
      }
      // Edge case: el email se registró entre checkEmail y el submit (race).
      if (result.existingUser) {
        try {
          await signIn("email", { email, redirect: false });
        } catch {
          // best-effort
        }
        setSuccess({ email, hasPassword: false, existingUser: true });
        return;
      }
      if (!result.hasPassword) {
        try {
          await signIn("email", { email, redirect: false });
        } catch {
          // best-effort
        }
      }
      setSuccess({
        email,
        hasPassword: result.hasPassword,
        existingUser: false,
      });
    });
  }

  if (success) {
    if (success.hasPassword) {
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
          <h2 className="font-display font-bold text-xl">¡Listo!</h2>
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Cuenta creada para{" "}
            <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>.
            Ya puedes entrar.
          </p>
          <a
            href={`/login?email=${encodeURIComponent(success.email)}`}
            className="k-btn-grad inline-block px-6 py-3 rounded-xl font-bold text-sm"
          >
            Entrar ahora →
          </a>
          {DEV_LOGIN_ENABLED ? (
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              (Dev: entrá con tu email + password <code>dev</code> en{" "}
              <a href="/login?dev=1" className="underline">
                /login
              </a>
              )
            </p>
          ) : null}
        </div>
      );
    }
    return (
      <MagicLinkWaiting
        email={success.email}
        title={success.existingUser ? "Bienvenido de vuelta" : "¡Listo!"}
        subtitle={
          success.existingUser ? (
            <>
              Detectamos que{" "}
              <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>{" "}
              ya tiene cuenta. Te mandamos un enlace mágico (y código de 6
              dígitos) para que entres sin tener que crearla de nuevo.
            </>
          ) : (
            <>
              Te enviamos un enlace mágico a{" "}
              <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>.
              Tócalo desde tu teléfono — o usa el código del email si el link no
              funciona.
            </>
          )
        }
      />
    );
  }

  // Fase 1: pedimos solo el email y decidimos según existencia.
  if (phase === "email") {
    return (
      <form
        onSubmit={handleEmailContinue}
        className="flex flex-col gap-4"
        data-testid="atleta-signup-email-phase"
      >
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="tu@email.com"
          error={errors.email}
          autoComplete="email"
          required
          autoFocus
        />

        <button
          type="submit"
          disabled={pending || email.length === 0}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-1"
        >
          {pending ? "Verificando…" : "Continuar"}
        </button>

        <p
          className="text-center text-[11px] leading-relaxed"
          style={{ color: "var(--k-t3)" }}
        >
          Si ya tienes cuenta te enviamos el código para entrar.
          <br />
          Si no, te ayudamos a crear una en 10 segundos.
        </p>
      </form>
    );
  }

  // Fase 3: ¿Por qué entrenas? (opcional, no bloqueante)
  if (phase === "goals") {
    const toggle = (g: FitnessGoalTag) =>
      setSelectedGoals((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
      );
    return (
      <div
        className="flex flex-col gap-4"
        data-testid="atleta-signup-goals-phase"
      >
        <div>
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--k-accent)" }}
          >
            Paso 3 · opcional
          </p>
          <h2
            className="font-display text-2xl font-bold mt-1"
            style={{ color: "var(--k-t1)" }}
          >
            ¿Por qué entrenas?
          </h2>
          <p
            className="text-[13px] mt-2"
            style={{ color: "var(--k-t2)", lineHeight: 1.45 }}
          >
            Esto nos ayuda a mostrarte lo que importa. Puedes elegir varios o
            saltar este paso — siempre puedes cambiarlo después.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FITNESS_GOAL_TAGS.map((g) => {
            const active = selectedGoals.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggle(g)}
                aria-pressed={active}
                className="k-tap"
                style={{
                  padding: "10px 14px",
                  background: active ? "var(--k-accent)" : "transparent",
                  color: active ? "var(--k-accent-on)" : "var(--k-t2)",
                  border: active
                    ? "1px solid var(--k-accent)"
                    : "1px solid var(--k-line)",
                  borderRadius: 999,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                {FITNESS_GOAL_LABEL[g]}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => submitWithGoals(selectedGoals)}
            disabled={pending}
            className="k-btn-grad flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {pending ? "Creando tu cuenta…" : "Crear cuenta"}
          </button>
          <button
            type="button"
            onClick={() => submitWithGoals([])}
            disabled={pending}
            className="px-4 rounded-xl text-xs font-mono uppercase tracking-wider"
            style={{
              border: "1px solid var(--k-line)",
              color: "var(--k-t3)",
            }}
          >
            Saltar
          </button>
        </div>
      </div>
    );
  }

  // Fase 2: usuario nuevo — pedimos nombre, apellido, password opcional.
  return (
    <form
      onSubmit={handleDetailsSubmit}
      className="flex flex-col gap-4"
      data-testid="atleta-signup-details-phase"
    >
      <div
        className="flex items-center justify-between rounded-xl border px-3 py-2.5"
        style={{
          background: "var(--k-elevated)",
          borderColor: "var(--k-line-2)",
        }}
      >
        <div className="flex flex-col min-w-0">
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Tu email
          </span>
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--k-t1)" }}
          >
            {email}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase("email");
            setErrors({});
          }}
          className="text-[10px] font-mono uppercase tracking-wider underline shrink-0 ml-2"
          style={{ color: "var(--k-t2)" }}
        >
          Cambiar
        </button>
      </div>

      <Field
        label="Nombre"
        name="firstName"
        type="text"
        value={firstName}
        onChange={setFirstName}
        placeholder="Cómo te llamamos"
        error={errors.firstName}
        autoComplete="given-name"
        required
        autoFocus
      />
      <Field
        label="Apellido"
        name="lastName"
        type="text"
        value={lastName}
        onChange={setLastName}
        placeholder="Tu apellido"
        error={errors.lastName}
        autoComplete="family-name"
        required
      />

      <div
        className="rounded-xl border p-3"
        style={{
          background: usePassword ? "var(--k-accent-soft)" : "var(--k-surface)",
          borderColor: usePassword ? "var(--k-accent-line)" : "var(--k-line-2)",
        }}
      >
        {!usePassword ? (
          <button
            type="button"
            onClick={() => setUsePassword(true)}
            className="w-full text-left text-xs font-mono uppercase tracking-wider flex items-center justify-between"
            style={{ color: "var(--k-t2)" }}
          >
            <span>+ Crear contraseña (opcional)</span>
            <span style={{ color: "var(--k-t3)" }}>→</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: "var(--k-t3)" }}
              >
                {isIos
                  ? "Contraseña (recomendada en iPhone)"
                  : "Contraseña (opcional)"}
              </label>
              {!isIos ? (
                <button
                  type="button"
                  onClick={() => {
                    setUsePassword(false);
                    setPassword("");
                  }}
                  className="text-[10px] underline"
                  style={{ color: "var(--k-t3)" }}
                >
                  saltar
                </button>
              ) : null}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 10 caracteres"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-16 rounded-xl text-sm border focus:outline-none transition-colors"
                style={{
                  background: "var(--k-elevated)",
                  borderColor: errors.password
                    ? "var(--k-danger)"
                    : "var(--k-line-2)",
                  color: "var(--k-t1)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "var(--k-t3)" }}
              >
                {showPassword ? "ocultar" : "ver"}
              </button>
            </div>
            {errors.password ? (
              <p className="text-[11px]" style={{ color: "var(--k-danger)" }}>
                {errors.password}
              </p>
            ) : (
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--k-t3)" }}
              >
                {isIos
                  ? "En iPhone los magic links pueden saltar entre Chrome y Safari. Con contraseña entras directo desde cualquier navegador."
                  : "Con contraseña puedes entrar sin esperar el email. Mínimo 10 caracteres con letras y números."}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-1"
      >
        Continuar →
      </button>

      <p
        className="text-center text-[11px] mt-1"
        style={{ color: "var(--k-t3)" }}
      >
        Sin tarjeta. Sin compromiso. Tus datos son tuyos.
      </p>
    </form>
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
  autoFocus?: boolean;
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
  autoFocus,
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
        autoFocus={autoFocus}
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
