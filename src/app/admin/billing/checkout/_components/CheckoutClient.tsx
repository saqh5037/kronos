"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Dot } from "lucide-react";
import {
  createSaasCheckout,
  confirmCheckoutMock,
  type SaasPlanRow,
} from "@/server/actions/saas-billing";
import { describeFeatures } from "@/lib/saas-billing";
import { formatMXN } from "@/lib/format";

type Props = {
  plans: SaasPlanRow[];
  mockMode: boolean;
  /** Demo wording only ever renders outside production. */
  isDev: boolean;
};

type CheckoutState =
  | { step: "select" }
  | {
      step: "mock-confirm";
      subscriptionId: string;
      planSlug: string;
    }
  | {
      step: "redirecting";
      url: string;
    }
  | { step: "done" };

/** "Gratis" / "$999 MXN" — cents in, one money format out. */
function planPrice(cents: number): string {
  return cents === 0 ? "Gratis" : formatMXN(cents / 100);
}

/** Pluralised limits — the shared helper says "Hasta 1 coaches". */
function planLimitLines(plan: SaasPlanRow): string[] {
  return [
    plan.maxAthletes === null
      ? "Atletas ilimitados"
      : `Hasta ${plan.maxAthletes} atleta${plan.maxAthletes === 1 ? "" : "s"}`,
    plan.maxCoaches === null
      ? "Coaches ilimitados"
      : `Hasta ${plan.maxCoaches} coach${plan.maxCoaches === 1 ? "" : "es"}`,
  ];
}

export function CheckoutClient({ plans, mockMode, isDev }: Props) {
  const router = useRouter();
  const [state, setState] = useState<CheckoutState>({ step: "select" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const demoWording = mockMode && isDev;

  const handleSelect = (slug: string) => {
    setError(null);
    startTransition(async () => {
      const res = await createSaasCheckout(slug);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (res.mode === "mock") {
        setState({
          step: "mock-confirm",
          subscriptionId: res.subscriptionId,
          planSlug: slug,
        });
      } else {
        const url = res.initPoint ?? res.sandboxInitPoint;
        if (!url) {
          setError("No se pudo obtener el enlace de pago.");
          return;
        }
        setState({ step: "redirecting", url });
        window.location.href = url;
      }
    });
  };

  const handleMockConfirm = (subscriptionId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await confirmCheckoutMock(subscriptionId);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setState({ step: "done" });
      router.push("/admin/billing?status=success");
      router.refresh();
    });
  };

  if (state.step === "mock-confirm") {
    const plan = plans.find((p) => p.slug === state.planSlug);
    return (
      <div className="k-card max-w-2xl p-6">
        {demoWording ? (
          <p className="k-eyebrow mb-2 text-[var(--k-t3)]">
            Solo en desarrollo
          </p>
        ) : null}
        <h2 className="font-display mb-3 text-2xl font-bold">
          Confirma la activación de <strong>{plan?.name}</strong>
        </h2>
        <p className="mb-4 text-[var(--k-t2)]">
          {demoWording
            ? "El cobro en línea todavía no está configurado en este entorno, así que puedes simularlo aquí: activa la suscripción sin ningún cargo real."
            : "Al confirmar, tu box queda activo de inmediato y te llega el comprobante por correo. Puedes cambiar de plan o cancelar cuando quieras."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => handleMockConfirm(state.subscriptionId)}
            className="k-btn-grad rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? "Activando…"
              : demoWording
                ? "Simular pago y activar"
                : "Confirmar y activar"}
          </button>
          <button
            type="button"
            onClick={() => setState({ step: "select" })}
            disabled={pending}
            className="k-btn-ghost rounded-full px-5 py-3 text-sm font-bold disabled:opacity-50"
          >
            Volver
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-[var(--k-danger)]/50 bg-[var(--k-danger)]/10 p-3 text-sm text-[var(--k-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (state.step === "redirecting") {
    return (
      <div className="k-card max-w-2xl p-6">
        <p>Te estamos llevando a Mercado Pago…</p>
      </div>
    );
  }

  const gridCols =
    plans.length === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : plans.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg border border-[var(--k-danger)]/50 bg-[var(--k-danger)]/10 p-3 text-sm text-[var(--k-danger)]">
          {error}
        </p>
      )}
      <div className={`grid gap-4 md:gap-5 ${gridCols}`}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            demoWording={demoWording}
            mockMode={mockMode}
            pending={pending}
            onSelect={() => handleSelect(plan.slug)}
          />
        ))}
      </div>
    </>
  );
}

function PlanCard({
  plan,
  demoWording,
  mockMode,
  pending,
  onSelect,
}: {
  plan: SaasPlanRow;
  demoWording: boolean;
  mockMode: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  const isFree = plan.priceMxnCents === 0;
  const featuresList = describeFeatures(plan.features);
  const limits = planLimitLines(plan);

  const ctaLabel = pending
    ? "Procesando…"
    : demoWording
      ? "Elegir plan (demo)"
      : mockMode
        ? "Activar plan"
        : "Pagar con Mercado Pago";

  return (
    <div className="k-card flex flex-col p-5 md:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
        {plan.slug === "pro" && (
          <span className="k-chip k-chip-ghost text-[10px]">Recomendado</span>
        )}
      </div>
      <div className="mb-1">
        <span className="font-display text-3xl font-extrabold md:text-4xl">
          {planPrice(plan.priceMxnCents)}
        </span>
        {!isFree && (
          <span className="ml-1 text-sm whitespace-nowrap text-[var(--k-t3)]">
            / mes
          </span>
        )}
      </div>
      {!isFree && (
        <p className="mb-4 text-[11px]" style={{ color: "var(--k-t3)" }}>
          más IVA
        </p>
      )}
      {isFree && <div className="mb-4" />}
      <ul className="mb-5 space-y-1.5 text-sm">
        {limits.map((l) => (
          <li key={l} className="flex items-center gap-2">
            <Dot
              size={16}
              strokeWidth={3}
              aria-hidden
              style={{ color: "var(--k-t3)" }}
            />
            <span>{l}</span>
          </li>
        ))}
        {featuresList.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check
              size={14}
              strokeWidth={2.6}
              aria-hidden
              style={{ color: "var(--k-accent)" }}
            />
            <span className="text-[var(--k-t2)]">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-3">
        {isFree ? (
          <>
            <button
              type="button"
              disabled
              className="k-btn-ghost w-full cursor-not-allowed rounded-full py-2.5 text-sm opacity-50"
            >
              Ya lo tienes
            </button>
            <p
              className="mt-2 text-center text-[11px]"
              style={{ color: "var(--k-t3)" }}
            >
              El plan gratuito viene incluido con tu prueba, no hay nada que
              activar.
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            disabled={pending}
            className="k-btn-grad w-full rounded-full py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
