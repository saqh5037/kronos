"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createIndependentAthlete } from "@/server/actions/atleta-signup";
import { kToast } from "@/lib/toast";
import { detectPwaPlatform } from "@/lib/pwa-detect";

type FieldErrors = Partial<
  Record<"email" | "firstName" | "lastName" | "password", string>
>;

type SuccessState = {
  email: string;
  hasPassword: boolean;
  existingUser: boolean;
};

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

type Props = {
  initialEmail?: string;
};

export default function AtletaSignupForm({ initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false); // expandido o no
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();
  const [isIos, setIsIos] = useState(false);

  // Detectar iOS post-mount (cliente only). Si es iOS, abrir el campo password
  // por defecto y marcar como recomendado.
  useEffect(() => {
    const platform = detectPwaPlatform(navigator.userAgent);
    const ios = platform === "ios-safari" || platform === "ios-other";
    setIsIos(ios);
    if (ios) setUsePassword(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await createIndependentAthlete({
        email,
        firstName,
        lastName,
        password: usePassword && password.length > 0 ? password : undefined,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        kToast.error(result.message);
        return;
      }
      // Si el email ya estaba registrado, mandamos magic link automáticamente
      // y mostramos copy "ya tenés cuenta, te enviamos magic link".
      if (result.existingUser) {
        try {
          await signIn("email", { email, redirect: false });
        } catch {
          // best-effort
        }
        setSuccess({ email, hasPassword: false, existingUser: true });
        return;
      }
      // Cuenta nueva: si NO seteó password, mandamos magic link.
      // Si SÍ, no hace falta (puede entrar con email/password).
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
        <h2 className="font-display font-bold text-xl">
          {success.existingUser ? "Ya tenés cuenta" : "¡Listo!"}
        </h2>

        {success.existingUser ? (
          <>
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              Detectamos que{" "}
              <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>{" "}
              ya estaba registrado. Te mandamos un enlace mágico para que entres
              sin tener que crearla de nuevo.
            </p>
            {isIos ? (
              <div
                className="rounded-xl border p-3 text-left"
                style={{
                  background: "var(--k-accent-soft)",
                  borderColor: "var(--k-accent-line)",
                }}
              >
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: "var(--k-accent)" }}
                >
                  ⚠️ Importante en iPhone
                </p>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--k-t2)" }}
                >
                  El link del email puede abrir en Chrome u otro navegador. Si
                  tenés problemas,{" "}
                  <a
                    href="/login"
                    className="underline"
                    style={{ color: "var(--k-accent)" }}
                  >
                    iniciá sesión con contraseña →
                  </a>{" "}
                  (si la creaste antes).
                </p>
              </div>
            ) : null}
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              ¿No te llegó? Revisá spam o pedí otro desde{" "}
              <a href="/login" className="underline">
                /login
              </a>
              .
            </p>
          </>
        ) : success.hasPassword ? (
          <>
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              Cuenta creada para{" "}
              <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>.
              Ya podés entrar.
            </p>
            <a
              href={`/login?email=${encodeURIComponent(success.email)}`}
              className="k-btn-grad inline-block px-6 py-3 rounded-xl font-bold text-sm"
            >
              Entrar ahora →
            </a>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              Te enviamos un enlace mágico a{" "}
              <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>.
              Hacé click ahí para entrar.
            </p>
            {isIos ? (
              <div
                className="rounded-xl border p-3 text-left"
                style={{
                  background: "var(--k-accent-soft)",
                  borderColor: "var(--k-accent-line)",
                }}
              >
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: "var(--k-accent)" }}
                >
                  ⚠️ Importante en iPhone
                </p>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--k-t2)" }}
                >
                  El link del email puede abrir en Chrome u otro navegador y
                  romper la sesión. Si tenés problemas,{" "}
                  <a
                    href="/login"
                    className="underline"
                    style={{ color: "var(--k-accent)" }}
                  >
                    iniciá sesión con contraseña →
                  </a>{" "}
                  (la podés crear desde tu perfil).
                </p>
              </div>
            ) : null}
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              Si no llega en 1 minuto, revisá spam o pedí otro desde{" "}
              <a href="/login" className="underline">
                iniciar sesión
              </a>
              .
            </p>
          </>
        )}

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      />
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

      {/* Sección password — auto-expandida en iOS por el bug de magic link */}
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
                  ? "En iPhone los magic links pueden saltar entre Chrome y Safari. Con contraseña entrás directo desde cualquier navegador."
                  : "Con contraseña podés entrar sin esperar el email. Mínimo 10 caracteres con letras y números."}
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
        {pending ? "Creando tu cuenta…" : "Empezar gratis"}
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
