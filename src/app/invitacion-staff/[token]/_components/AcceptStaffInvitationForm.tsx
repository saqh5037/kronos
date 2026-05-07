"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { acceptStaffInvitation } from "@/server/actions/staff-invitations";

type Props = {
  token: string;
  email: string;
  defaultName: string;
};

export function AcceptStaffInvitationForm({
  token,
  email,
  defaultName,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await acceptStaffInvitation({ token, name: name.trim() });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--moss)]/40 bg-[var(--moss)]/10 p-4">
          <p className="font-bold text-[var(--moss)]">✓ ¡Listo!</p>
          <p className="text-sm mt-1">
            Tu cuenta para <strong>{email}</strong> quedó activa.
          </p>
        </div>
        <p className="text-sm text-[var(--text-2)]">
          Iniciá sesión con tu email para entrar al admin del Box:
        </p>
        <Link
          href={`/login?email=${encodeURIComponent(email)}`}
          className="k-btn-grad w-full text-center block"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="k-eyebrow block mb-1">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-lg p-2.5 bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text-2)] text-sm"
        />
      </div>

      <div>
        <label htmlFor="name" className="k-eyebrow block mb-1">
          Nombre completo
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          className="w-full rounded-lg p-2.5 bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--strain)]"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--pr)]/50 bg-[var(--pr)]/10 p-3 text-sm text-[var(--pr)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || name.trim().length < 2}
        className="k-btn-grad w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Activando…" : "Activar mi cuenta"}
      </button>
    </form>
  );
}
