"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPassword, clearPassword } from "@/server/actions/password";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/password";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirmValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    startTransition(async () => {
      const result = await setPassword({ password, confirm });
      if (result.ok) {
        setSuccess(
          hasPassword
            ? "Contraseña actualizada"
            : "Contraseña configurada — ahora puedes entrar con email + contraseña",
        );
        setPasswordValue("");
        setConfirmValue("");
        router.refresh();
      } else {
        setError(result.message);
        if (result.error === "VALIDATION" && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  }

  function handleClear() {
    if (
      !confirm &&
      !window.confirm("¿Seguro? Volverás a depender solo del magic link.")
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await clearPassword();
      if (result.ok) {
        setSuccess("Contraseña eliminada");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSet} className="grid gap-4">
      <Field
        label="Nueva contraseña"
        type="password"
        value={password}
        onChange={setPasswordValue}
        hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres, al menos 1 letra y 1 dígito`}
        error={fieldErrors.password}
        autoComplete="new-password"
      />
      <Field
        label="Confirmar contraseña"
        type="password"
        value={confirm}
        onChange={setConfirmValue}
        error={fieldErrors.confirm}
        autoComplete="new-password"
      />

      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm font-medium" style={{ color: "var(--k-accent)" }}>
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-2">
        <button
          type="submit"
          disabled={pending || !password || !confirm}
          className="k-btn-grad px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {pending
            ? "Guardando…"
            : hasPassword
              ? "Cambiar contraseña"
              : "Configurar contraseña"}
        </button>
        {hasPassword && (
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="k-btn-ghost px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            Eliminar contraseña
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  hint,
  error,
  autoComplete,
}: {
  label: string;
  type: "password" | "text";
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: "var(--k-t2)" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--k-surface)",
          color: "var(--k-t1)",
          border: `1px solid ${error ? "var(--k-danger)" : "var(--k-line-2)"}`,
        }}
      />
      {hint && !error && (
        <span className="text-xs" style={{ color: "var(--k-t3)" }}>
          {hint}
        </span>
      )}
      {error && (
        <span className="text-xs" style={{ color: "var(--k-danger)" }}>
          {error}
        </span>
      )}
    </label>
  );
}
