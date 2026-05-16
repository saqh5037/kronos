"use client";

import { useState, useTransition } from "react";
import { signPilotBeta } from "@/server/actions/pilot-beta";
import { kToast } from "@/lib/toast";

type FieldErrors = Partial<Record<"fullName" | "acceptTerms", string>>;

export default function PilotBetaSignForm({
  token,
  boxName,
}: {
  token: string;
  boxName: string;
}) {
  const [fullName, setFullName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<{ signedAt: Date } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!acceptTerms) {
      setErrors({ acceptTerms: "Debes aceptar los términos" });
      return;
    }

    startTransition(async () => {
      const result = await signPilotBeta({
        token,
        fullName,
        acceptTerms: true,
        website,
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors as FieldErrors);
        }
        kToast.error(result.message);
        return;
      }
      setSuccess({ signedAt: result.signedAt });
    });
  }

  if (success) {
    const formatted = success.signedAt.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div
        className="k-card p-6 text-center flex flex-col gap-3"
        style={{ borderColor: "var(--k-accent-line)" }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
          style={{ background: "var(--k-accent-soft)" }}
        >
          <span
            className="font-display font-bold text-xl"
            style={{ color: "var(--k-accent)" }}
          >
            ✓
          </span>
        </div>
        <h3
          className="font-display font-bold text-lg"
          style={{ color: "var(--k-t1)" }}
        >
          ¡Acuerdo firmado!
        </h3>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          <strong style={{ color: "var(--k-t1)" }}>{boxName}</strong> queda
          activo como piloto desde {formatted}.
        </p>
        <p className="text-[12px]" style={{ color: "var(--k-t3)" }}>
          Te llegará un correo con el detalle. Si tarda más de 5 min, revisa
          spam o escribe a contacto@kronos-fit.com.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot — invisible al usuario */}
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

      <div className="flex flex-col gap-1">
        <label
          htmlFor="fullName"
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Tu nombre legal completo
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre completo"
          required
          autoComplete="name"
          className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
          style={{
            background: "var(--k-surface)",
            borderColor: errors.fullName
              ? "var(--k-danger)"
              : "var(--k-line-2)",
            color: "var(--k-t1)",
          }}
        />
        {errors.fullName ? (
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "var(--k-danger)" }}
          >
            {errors.fullName}
          </p>
        ) : (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--k-t3)" }}>
            Como firmante autorizado del Box. Usaremos este nombre en el
            registro legal.
          </p>
        )}
      </div>

      <label
        className="flex items-start gap-3 cursor-pointer text-sm"
        style={{ color: "var(--k-t1)" }}
      >
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5"
          required
        />
        <span>
          Confirmo que tengo autoridad legal para firmar a nombre de{" "}
          <strong>{boxName}</strong> y acepto los términos del piloto: trial 30
          días gratuitos, exclusividad geográfica 60 días, uso de logo en
          materiales como Founding Partner.
        </span>
      </label>
      {errors.acceptTerms ? (
        <p className="text-[11px] -mt-2" style={{ color: "var(--k-danger)" }}>
          {errors.acceptTerms}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
      >
        {pending ? "Firmando…" : "Firmar acuerdo piloto"}
      </button>
    </form>
  );
}
