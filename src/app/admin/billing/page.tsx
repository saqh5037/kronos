import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import KCard from "@/components/kronos/KCard";
import Eyebrow from "@/components/kronos/Eyebrow";
import type { SubscriptionStatus } from "@/lib/subscription";
import { getCurrentSubscription } from "@/server/actions/saas-billing";
import { formatPriceMxn } from "@/lib/saas-billing";

export const metadata = { title: "Kronos — Suscripción" };

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
        eyebrow: "Trial activo",
        title:
          days != null
            ? `Tu prueba termina en ${days} día${days === 1 ? "" : "s"}`
            : "Estás en período de prueba",
        body: "Convertí tu trial en una suscripción para que tu box no se interrumpa cuando se acabe la prueba.",
        cta: { label: "Activar suscripción", href: "/admin/billing/checkout" },
        tone: "info",
      };
    }
    case "ACTIVE":
      return {
        eyebrow: "Suscripción activa",
        title: "Tu box está al día",
        body: "Tu plan está vigente. Acá vas a ver las facturas y el método de pago cuando esté wired el cobro.",
        cta: null,
        tone: "success",
      };
    case "PAST_DUE":
      return {
        eyebrow: "Pago pendiente",
        title: "Necesitamos actualizar tu pago",
        body: "El último cobro falló. Actualizá tu método de pago para evitar que tu box quede en EXPIRED.",
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
        body: "Podés reactivar tu suscripción cuando quieras y seguís manteniendo tus datos.",
        cta: { label: "Reactivar", href: "/admin/billing/checkout" },
        tone: "warning",
      };
    case "EXPIRED":
      return {
        eyebrow: "Acceso bloqueado",
        title: "Tu suscripción expiró",
        body: "Para volver a operar tu box, activá una suscripción. Tus datos siguen acá esperándote.",
        cta: { label: "Reactivar ahora", href: "/admin/billing/checkout" },
        tone: "danger",
      };
    default:
      return {
        eyebrow: "Suscripción",
        title: "Configurá tu suscripción",
        body: "Aún no tenés un estado de suscripción registrado.",
        cta: null,
        tone: "info",
      };
  }
}

const TONE_COLOR: Record<StatusCopy["tone"], string> = {
  info: "var(--blue)",
  warning: "var(--orange, #ffa53d)",
  danger: "var(--red)",
  success: "var(--green, #19f08b)",
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const [box, currentSub] = await Promise.all([
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
  ]);
  if (!box) redirect("/login");

  const status = box.subscriptionStatus as SubscriptionStatus;
  const copy = copyForStatus(status, box.trialEndsAt);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Eyebrow color={copy.tone === "danger" ? "red" : "blue"}>
        {copy.eyebrow}
      </Eyebrow>
      <h1
        className="mt-3 mb-2 font-display font-extrabold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.02em]"
        style={{ color: "var(--text)" }}
      >
        {copy.title}
      </h1>
      <p
        className="mb-6 md:mb-8 text-base leading-relaxed"
        style={{ color: "var(--text-2)" }}
      >
        {copy.body}
      </p>

      <KCard animate={false} className="p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: "var(--text-3)" }}
            >
              Estado actual
            </div>
            <div
              className="mt-1 text-2xl font-display font-bold"
              style={{ color: TONE_COLOR[copy.tone] }}
            >
              {status}
            </div>
          </div>
          {box.trialEndsAt && status === "TRIAL" ? (
            <div className="text-right">
              <div
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: "var(--text-3)" }}
              >
                Trial termina
              </div>
              <div
                className="mt-1 text-base font-medium"
                style={{ color: "var(--text)" }}
              >
                {box.trialEndsAt.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          ) : null}
        </div>

        {currentSub ? (
          <div className="pt-2 border-t border-[var(--border)]">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] mb-1">
              Plan actual
            </div>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="font-display text-xl font-bold">
                {currentSub.plan.name}
              </div>
              <div className="text-sm text-[var(--text-2)]">
                {formatPriceMxn(currentSub.plan.priceMxnCents)} / mes
              </div>
            </div>
            {currentSub.currentPeriodEnd && (
              <p className="mt-2 text-xs text-[var(--text-3)]">
                Próxima facturación:{" "}
                {currentSub.currentPeriodEnd.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ) : null}

        {copy.cta ? (
          <div className="pt-2">
            <Link
              href="/admin/billing/checkout"
              className="inline-block k-btn-grad px-5 py-3 rounded-full font-bold text-sm"
            >
              {copy.cta.label}
            </Link>
          </div>
        ) : null}
      </KCard>
    </div>
  );
}
