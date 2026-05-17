"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { acceptInvitation } from "@/server/actions/athlete-invitations";

type Props = {
  token: string;
  email: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultPhone: string;
};

export function AcceptInvitationForm({
  token,
  email,
  defaultFirstName,
  defaultLastName,
  defaultPhone,
}: Props) {
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await acceptInvitation({
        token,
        firstName,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
      });
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
        <div className="rounded-lg border border-[var(--k-accent-line)] bg-[var(--k-accent-soft)] p-4">
          <p className="font-bold text-[var(--k-accent)]">✓ ¡Listo!</p>
          <p className="text-sm mt-1">
            Tu cuenta de atleta para <strong>{email}</strong> quedó creada.
          </p>
        </div>
        <p className="text-sm text-[var(--k-t2)]">
          Inicia sesión con tu email para entrar a la app:
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
          className="w-full rounded-lg p-2.5 bg-[var(--k-surface)] border border-[var(--k-line-2)] text-[var(--k-t2)] text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="firstName" className="k-eyebrow block mb-1">
            Nombre
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            minLength={1}
            maxLength={80}
            className="w-full rounded-lg p-2.5 bg-[var(--k-surface)] border border-[var(--k-line-2)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-accent-line)]"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="k-eyebrow block mb-1">
            Apellido
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg p-2.5 bg-[var(--k-surface)] border border-[var(--k-line-2)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-accent-line)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="k-eyebrow block mb-1">
          Teléfono <span className="text-[var(--k-t3)]">(opcional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          className="w-full rounded-lg p-2.5 bg-[var(--k-surface)] border border-[var(--k-line-2)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-accent-line)]"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--k-danger)]/50 bg-[var(--k-danger)]/10 p-3 text-sm text-[var(--k-danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || firstName.trim().length === 0}
        className="k-btn-grad w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Aceptando…" : "Aceptar invitación"}
      </button>
    </form>
  );
}
