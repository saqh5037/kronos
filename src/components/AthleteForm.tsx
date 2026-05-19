"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteAthletes } from "@/server/actions/athlete-invitations";
import { kToast } from "@/lib/toast";
import { KModal } from "@/components/kronos/KModal";

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "dob", string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AthleteForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDob("");
    setErrors({});
  }

  function close() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = "Requerido";
    if (!lastName.trim()) next.lastName = "Requerido";
    if (!email.trim()) {
      next.email = "Requerido para enviar invitación";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Email inválido";
    }
    if (dob) {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) {
        next.dob = "Fecha inválida";
      } else if (d.getTime() > Date.now()) {
        next.dob = "No puede ser a futuro";
      }
    }
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    startTransition(async () => {
      try {
        // TODO(kronos): persistir `dob` cuando AthleteInvitation tenga el campo.
        // Hoy lo capturamos en UI pero requiere migration para guardarlo.
        const result = await inviteAthletes([
          {
            email: email.trim().toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
          },
        ]);
        if (!result.ok) {
          kToast.error(result.message);
          return;
        }
        if (result.created > 0) {
          kToast.success(`Invitación enviada a ${email.trim()}`);
        } else if (result.skipped.length > 0) {
          kToast.info(
            `${email.trim()} — ${result.skipped[0]?.reason ?? "ya invitado"}`,
          );
        }
        reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        kToast.error(
          err instanceof Error ? err.message : "Error al invitar atleta",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nuevo atleta
      </button>

      <KModal
        open={open}
        onClose={close}
        title="Invitar atleta"
        description="Le enviamos un email con un link para completar su perfil."
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Nombre"
              required
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              error={errors.firstName}
            />
            <Field
              label="Apellido"
              required
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
              error={errors.lastName}
            />
          </div>

          <Field
            label="Email"
            required
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={errors.email}
            hint="Le llega la invitación a este correo."
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Teléfono"
              type="tel"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              error={errors.phone}
            />
            <Field
              label="Fecha de nacimiento"
              type="date"
              value={dob}
              onChange={setDob}
              error={errors.dob}
            />
          </div>

          <div className="mt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="px-4 py-2.5 rounded-full font-bold text-sm border disabled:opacity-50"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t2)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Enviar invitación"}
            </button>
          </div>
        </form>
      </KModal>
    </>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  hint,
  error,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
        {required ? <span style={{ color: "var(--k-accent)" }}> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-elevated)",
          borderColor: error ? "var(--k-danger)" : "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      {error ? (
        <span
          className="text-[11px] mt-0.5"
          style={{ color: "var(--k-danger)" }}
        >
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] mt-0.5" style={{ color: "var(--k-t3)" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
