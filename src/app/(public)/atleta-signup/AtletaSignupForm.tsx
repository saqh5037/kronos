"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createIndependentAthlete } from "@/server/actions/atleta-signup";
import { kToast } from "@/lib/toast";

type FieldErrors = Partial<Record<"email" | "firstName" | "lastName", string>>;

type SuccessState = { email: string };

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

type Props = {
  initialEmail?: string;
};

export default function AtletaSignupForm({ initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await createIndependentAthlete({
        email,
        firstName,
        lastName,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        kToast.error(result.message);
        return;
      }
      try {
        await signIn("email", { email, redirect: false });
      } catch {
        // Falla silenciosa: la cuenta ya existe, el usuario puede pedir
        // magic link otra vez desde /login.
      }
      setSuccess({ email });
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
        <h2 className="font-display font-bold text-xl">¡Listo!</h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Te enviamos un enlace mágico a{" "}
          <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong>.
          Hacé click ahí para entrar.
        </p>
        <p className="text-xs" style={{ color: "var(--k-t3)" }}>
          Si no llega en 1 minuto, revisá spam o pedí otro desde{" "}
          <a href="/login" className="underline">
            iniciar sesión
          </a>
          .
        </p>
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
        label="Apellido (opcional)"
        name="lastName"
        type="text"
        value={lastName}
        onChange={setLastName}
        placeholder=""
        error={errors.lastName}
        autoComplete="family-name"
      />

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
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
