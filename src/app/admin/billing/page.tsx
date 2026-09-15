import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, Receipt } from "lucide-react";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import KCard from "@/components/kronos/KCard";
import Eyebrow from "@/components/kronos/Eyebrow";
import type { SubscriptionStatus } from "@/lib/subscription";
import {
  getCurrentSubscription,
  getOwnerSaasSpendMetrics,
} from "@/server/actions/saas-billing";
import { formatDateLong, formatMXN } from "@/lib/format";
import { label, saasSubscriptionStatusLabel } from "@/lib/labels";
import { CancelSubscriptionButton } from "./_components/CancelSubscriptionButton";
import { SpendMetricsCard } from "./_components/SpendMetricsCard";
import { isDominusPromoActive, promoDaysLeft } from "@/lib/dominus-promo";
import { supportMailto } from "@/lib/contact";

export const metadata = { title: "Kronos — Suscripción" };
export const dynamic = "force-dynamic";

/** "$999 MXN" / "Gratis" — cents in, one money format out. */
function planPrice(cents: number): string {
  return cents === 0 ? "Gratis" : formatMXN(cents / 100);
}

type StatusCopy = {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string } | null;
  tone: "info" | "warning" | "danger" | "success";
};

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function copyForStatus(
  status: SubscriptionStatus | null,
  trialEndsAt: Date | null,
): StatusCopy {
  switch (status) {
    case "TRIAL": {
      const days = daysUntil(trialEndsAt);
      return {
        eyebrow: "Prueba activa",
        title:
          days != null
            ? `Tu prueba termina en ${days} día${days === 1 ? "" : "s"}`
            : "Estás en período de prueba",
        body: "Activa tu suscripción para que tu box no se interrumpa cuando termine la prueba.",
        cta: { label: "Activar suscripción", href: "/admin/billing/checkout" },
        tone: "info",
      };
    }
    case "ACTIVE":
      return {
        eyebrow: "Suscripción activa",
        title: "Tu box está al día",
        body: "Tu plan está vigente. Abajo ves el plan, el precio y la próxima fecha de cobro.",
        cta: null,
        tone: "success",
      };
    case "PAST_DUE":
      return {
        eyebrow: "Pago pendiente",
        title: "Necesitamos actualizar tu pago",
        body: "El último cobro falló. Actualiza tu método de pago para que tu suscripción no expire.",
        cta: {
          label: "Actualizar pago",
          href: "/admin/billing/payment-method",
        },
        tone: "warning",
      };
    case "CANCELLED":
      return {
        eyebrow: "Suscripción cancelada",
        title: "Cancelaste tu plan",
        body: "Puedes reactivar tu suscripción cuando quieras y conservas todos tus datos.",
        cta: { label: "Reactivar", href: "/admin/billing/checkout" },
        tone: "warning",
      };
    case "EXPIRED":
      return {
        eyebrow: "Acceso bloqueado",
        title: "Tu suscripción expiró",
        body: "Para volver a operar tu box, activa una suscripción. Tus datos siguen aquí esperándote.",
        cta: { label: "Reactivar ahora", href: "/admin/billing/checkout" },
        tone: "danger",
      };
    default:
      return {
        eyebrow: "Suscripción",
        title: "Configura tu suscripción",
        body: "Aún no tienes un estado de suscripción registrado.",
        cta: null,
        tone: "info",
      };
  }
}

const TONE_COLOR: Record<StatusCopy["tone"], string> = {
  info: "var(--k-accent)",
  warning: "var(--k-warning)",
  danger: "var(--k-danger)",
  success: "var(--k-accent)",
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const [box, currentSub, spendMetrics] = await Promise.all([
    prismaBase.box.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        subscriptionStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    }),
    getCurrentSubscription(),
    getOwnerSaasSpendMetrics(),
  ]);
  if (!box) redirect("/login");

  const status = box.subscriptionStatus as SubscriptionStatus;
  const copy = copyForStatus(status, box.trialEndsAt);

  const showFoundingPromo = isDominusPromoActive() && status === "TRIAL";
  const promoDays = promoDaysLeft();

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      {showFoundingPromo ? (
        <div
          className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border p-4 md:flex-nowrap md:p-5"
          style={{
            background: "var(--k-accent-soft)",
            borderColor: "var(--k-accent-line)",
          }}
        >
          <div className="min-w-[200px] flex-1">
            <div
              className="mb-1 font-mono text-[10px] tracking-wider uppercase"
              style={{ color: "var(--k-accent)" }}
            >
              · {promoDays === 1 ? "Último día" : `${promoDays} días`} ·
              Founding Box Dominus
            </div>
            <div
              className="font-display mb-1 text-base font-bold"
              style={{ color: "var(--k-t1)" }}
            >
              Asegura tu precio fundador antes del 23 de mayo
            </div>
            <div
              className="text-xs leading-relaxed"
              style={{ color: "var(--k-t2)" }}
            >
              $3,500 MXN/mes fijos por 12 meses + 3 meses gratis al pagar anual.
              Onboarding uno a uno incluido. Si te interesa, escríbenos y te
              activamos el plan Founding sobre tu Box actual.
            </div>
          </div>
          <a
            href={supportMailto("Quiero Founding Box Dominus")}
            className="k-btn-grad inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap"
          >
            Activar Founding
            <ArrowRight size={14} strokeWidth={2.4} aria-hidden />
          </a>
        </div>
      ) : null}

      <Eyebrow color={copy.tone === "danger" ? "red" : "blue"}>
        {copy.eyebrow}
      </Eyebrow>
      <h1
        className="font-display mt-3 mb-2 text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em] md:text-[40px]"
        style={{ color: "var(--k-t1)" }}
      >
        {copy.title}
      </h1>
      <p
        className="mb-6 text-base leading-relaxed md:mb-8"
        style={{ color: "var(--k-t2)" }}
      >
        {copy.body}
      </p>

      <KCard animate={false} className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div
              className="font-mono text-xs tracking-wider uppercase"
              style={{ color: "var(--k-t3)" }}
            >
              Estado actual
            </div>
            <div
              className="font-display mt-1 text-2xl font-bold"
              style={{ color: TONE_COLOR[copy.tone] }}
            >
              {label("subscriptionStatus", status)}
            </div>
          </div>
          {box.trialEndsAt && status === "TRIAL" ? (
            <div className="text-right">
              <div
                className="font-mono text-xs tracking-wider uppercase"
                style={{ color: "var(--k-t3)" }}
              >
                La prueba termina
              </div>
              <div
                className="mt-1 text-base font-medium"
                style={{ color: "var(--k-t1)" }}
              >
                {formatDateLong(box.trialEndsAt)}
              </div>
            </div>
          ) : null}
        </div>

        {currentSub ? (
          <div className="border-t border-[var(--k-line)] pt-3">
            <div className="mb-1 font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase">
              Tu plan
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="font-display text-xl font-bold">
                {currentSub.plan.name}
              </div>
              <div className="text-sm text-[var(--k-t2)]">
                {planPrice(currentSub.plan.priceMxnCents)} al mes
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[var(--k-t3)]">Estado del plan</dt>
                <dd className="mt-0.5 text-[var(--k-t1)]">
                  {saasSubscriptionStatusLabel[currentSub.status]}
                </dd>
              </div>
              {currentSub.startsAt ? (
                <div>
                  <dt className="text-[var(--k-t3)]">Activo desde</dt>
                  <dd className="mt-0.5 text-[var(--k-t1)]">
                    {formatDateLong(currentSub.startsAt)}
                  </dd>
                </div>
              ) : null}
              {currentSub.currentPeriodEnd ? (
                <div>
                  <dt className="text-[var(--k-t3)]">Próxima facturación</dt>
                  <dd className="mt-0.5 text-[var(--k-t1)]">
                    {formatDateLong(currentSub.currentPeriodEnd)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : (
          <div className="border-t border-[var(--k-line)] pt-3">
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              Todavía no hay un plan contratado. Cuando elijas uno verás aquí el
              precio, el estado y la fecha del siguiente cobro.
            </p>
          </div>
        )}

        {copy.cta ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/admin/billing/checkout"
              className="k-btn-grad inline-block rounded-full px-5 py-3 text-sm font-bold"
            >
              {copy.cta.label}
            </Link>
          </div>
        ) : null}

        {currentSub && status === "ACTIVE" ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/admin/billing/checkout"
              className="k-btn-ghost inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            >
              Cambiar de plan
            </Link>
            <CancelSubscriptionButton />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--k-line)] pt-3">
          <Link
            href="/admin/billing/checkout"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: "var(--k-accent)" }}
          >
            Ver planes
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
          </Link>
          <Link
            href="/admin/billing/historial"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: "var(--k-t2)" }}
          >
            <Receipt size={14} strokeWidth={2} aria-hidden />
            Historial de cobros
          </Link>
        </div>
      </KCard>

      {spendMetrics && (
        <div className="mt-4">
          <SpendMetricsCard metrics={spendMetrics} />
        </div>
      )}
    </div>
  );
}
