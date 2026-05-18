"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSaasCheckout,
  confirmCheckoutMock,
  type SaasPlanRow,
} from "@/server/actions/saas-billing";
import {
  formatPriceMxn,
  describePlanLimits,
  describeFeatures,
} from "@/lib/saas-billing";

type Props = {
  plans: SaasPlanRow[];
  mockMode: boolean;
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

export function CheckoutClient({ plans, mockMode }: Props) {
  const router = useRouter();
  const [state, setState] = useState<CheckoutState>({ step: "select" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
          setError("No se pudo obtener el link de pago.");
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
      <div className="k-card p-6 max-w-2xl">
        <p className="k-eyebrow text-[var(--k-t3)] mb-2">Modo demo</p>
        <h2 className="font-display text-2xl font-bold mb-3">
          Confirma la activación de <strong>{plan?.name}</strong>
        </h2>
        <p className="text-[var(--k-t2)] mb-4">
          MercadoPago no está configurado en este servidor, así que puedes
          simular el cobro acá. Esto activa la suscripción inmediatamente sin
          cargo real.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => handleMockConfirm(state.subscriptionId)}
            className="k-btn-grad px-5 py-3 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Activando…" : "Confirmar pago (mock)"}
          </button>
          <button
            type="button"
            onClick={() => setState({ step: "select" })}
            disabled={pending}
            className="k-btn-ghost px-5 py-3 rounded-full font-bold text-sm disabled:opacity-50"
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
      <div className="k-card p-6 max-w-2xl">
        <p>Redirigiendo a MercadoPago…</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg border border-[var(--k-danger)]/50 bg-[var(--k-danger)]/10 p-3 text-sm text-[var(--k-danger)]">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            mockMode={mockMode}
            pending={pending}
            onSelect={() => handleSelect(plan.slug)}
          />
        ))}
      </div>
      {mockMode && (
        <p className="mt-6 text-xs text-[var(--k-t3)]">
          Para activar cobros reales con MercadoPago, configura la variable de
          entorno <code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code>.
        </p>
      )}
    </>
  );
}

function PlanCard({
  plan,
  mockMode,
  pending,
  onSelect,
}: {
  plan: SaasPlanRow;
  mockMode: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  const isFree = plan.priceMxnCents === 0;
  const featuresList = describeFeatures(plan.features);
  const limits = describePlanLimits({
    maxAthletes: plan.maxAthletes,
    maxCoaches: plan.maxCoaches,
  });

  return (
    <div className="k-card p-5 md:p-6 flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
        {plan.slug === "pro" && (
          <span className="k-chip k-chip-strain">Recomendado</span>
        )}
      </div>
      <div className="mb-4">
        <span className="font-display text-3xl md:text-4xl font-extrabold">
          {formatPriceMxn(plan.priceMxnCents)}
        </span>
        {!isFree && (
          <span className="text-sm text-[var(--k-t3)] ml-1">/ mes</span>
        )}
      </div>
      <ul className="space-y-1.5 mb-5 text-sm">
        {limits.map((l) => (
          <li key={l} className="flex items-center gap-2">
            <span style={{ color: "var(--k-warning)" }}>·</span>
            <span>{l}</span>
          </li>
        ))}
        {featuresList.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span style={{ color: "var(--k-accent)" }}>✓</span>
            <span className="text-[var(--k-t2)]">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-3">
        {isFree ? (
          <button
            type="button"
            disabled
            className="w-full k-btn-ghost py-2.5 rounded-full text-sm opacity-50 cursor-not-allowed"
            title="Plan Free se asigna automáticamente"
          >
            Incluido en trial
          </button>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            disabled={pending}
            className="w-full k-btn-grad py-2.5 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending
              ? "Procesando…"
              : mockMode
                ? "Elegir plan (demo)"
                : "Pagar con MercadoPago"}
          </button>
        )}
      </div>
    </div>
  );
}
