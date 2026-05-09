"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createBoxAndOwner } from "@/server/actions/signup";
import { slugify } from "@/lib/slug";
import { kToast } from "@/lib/toast";

type FieldErrors = Partial<
  Record<"email" | "ownerName" | "boxName" | "slug", string>
>;

type SuccessState = {
  email: string;
  trialEndsAt: Date;
  slug: string;
};

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

type SignupFormProps = {
  initialEmail?: string;
  reason?: string;
};

export default function SignupForm({
  initialEmail = "",
  reason = "",
}: SignupFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [ownerName, setOwnerName] = useState("");
  const [boxName, setBoxName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();

  function onBoxNameChange(value: string) {
    setBoxName(value);
    if (!slugTouched) setSlug(slugify(value).slice(0, 40));
  }

  function onSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await createBoxAndOwner({
        email,
        ownerName,
        boxName,
        slug,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        kToast.error(result.message);
        return;
      }
      try {
        await signIn("email", { email, redirect: false });
      } catch {
        // Falla silenciosa: mostraremos al usuario el siguiente paso.
        // El usuario aún puede entrar via login email + magic link.
      }
      setSuccess({
        email,
        trialEndsAt: result.trialEndsAt,
        slug: result.slug,
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
        <h2 className="font-display font-bold text-xl">¡Tu box está creado!</h2>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Te enviamos un enlace mágico a{" "}
          <strong style={{ color: "var(--k-t1)" }}>{success.email}</strong> para
          activar tu cuenta.
        </p>
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "var(--k-elevated)", color: "var(--k-t3)" }}
        >
          Slug: <strong>{success.slug}</strong> · Trial hasta{" "}
          {success.trialEndsAt.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        {DEV_LOGIN_ENABLED ? (
          <p className="text-xs" style={{ color: "var(--k-t3)" }}>
            (Dev: si no llega email, podés entrar con tu email + password{" "}
            <code>dev</code> en{" "}
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
      {reason === "no_account" && initialEmail ? (
        <div
          className="rounded-xl border p-3 text-xs leading-relaxed"
          style={{
            background: "var(--k-accent-soft)",
            borderColor: "var(--k-accent-line)",
            color: "var(--k-t1)",
          }}
        >
          Detectamos que intentaste entrar con{" "}
          <strong style={{ color: "var(--k-accent)" }}>{initialEmail}</strong>{" "}
          pero todavía no tenés cuenta. Si sos dueño de un box, completá tu
          registro acá. Si sos atleta,{" "}
          <a
            href={`/atleta-signup?email=${encodeURIComponent(initialEmail)}`}
            className="underline"
            style={{ color: "var(--k-accent)" }}
          >
            registrate gratis acá →
          </a>
        </div>
      ) : null}
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
        label="Nombre del box"
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="iron-hands"
            required
            className="flex-1 px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
            style={{
              background: "var(--k-surface)",
              borderColor: errors.slug ? "var(--k-danger)" : "var(--k-line-2)",
              color: "var(--k-t1)",
            }}
          />
        </div>
        <p
          className="text-[11px] mt-0.5"
          style={{
            color: errors.slug ? "var(--k-danger)" : "var(--k-t3)",
          }}
        >
          {errors.slug ?? "Solo minúsculas, números y guiones. Editable."}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
      >
        {pending ? "Creando tu box…" : "Empezar prueba de 14 días"}
      </button>

      <p
        className="text-center text-[11px] mt-1"
        style={{ color: "var(--k-t3)" }}
      >
        Sin tarjeta de crédito. Cancelás cuando quieras.
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
