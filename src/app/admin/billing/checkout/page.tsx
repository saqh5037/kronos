import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { listSaasPlans } from "@/server/actions/saas-billing";
import { isMockMode, nextBillingDate } from "@/lib/saas-billing";
import { formatDateLong } from "@/lib/format";
import { CheckoutClient } from "./_components/CheckoutClient";

export const metadata = { title: "Kronos — Activar suscripción" };
export const dynamic = "force-dynamic";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default async function BillingCheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const [plans, box] = await Promise.all([
    listSaasPlans(),
    prismaBase.box.findUnique({
      where: { id: session.user.tenantId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    }),
  ]);

  const mockMode = isMockMode();
  /**
   * Dev configuration never reaches a box owner (audit 2026-09-15, P0 #7).
   * In production the demo wording and the env-var hint are simply absent.
   */
  const isDev = process.env.NODE_ENV !== "production";
  const trialDaysLeft =
    box?.subscriptionStatus === "TRIAL" ? daysUntil(box.trialEndsAt) : null;
  const nextCharge = formatDateLong(nextBillingDate());

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <p className="k-eyebrow mb-2 text-[var(--k-t3)]">Activar suscripción</p>
      <h1 className="font-display mb-3 text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em] md:text-[40px]">
        Elige tu <em style={{ color: "var(--k-accent)" }}>plan</em>
      </h1>
      <p className="mb-4 text-base leading-relaxed text-[var(--k-t2)]">
        Mantén tu box en línea, sin interrupciones. Puedes cambiar de plan o
        cancelar cuando quieras.
      </p>

      <ul
        className="mb-6 flex flex-col gap-1.5 text-sm md:mb-8"
        style={{ color: "var(--k-t2)" }}
      >
        {trialDaysLeft !== null ? (
          <li>
            Te quedan{" "}
            <strong style={{ color: "var(--k-t1)" }}>
              {trialDaysLeft} día{trialDaysLeft === 1 ? "" : "s"}
            </strong>{" "}
            de prueba. Si activas hoy, no pierdes lo que resta.
          </li>
        ) : null}
        <li>
          <strong style={{ color: "var(--k-t1)" }}>Qué pasa después:</strong> al
          confirmar, tu box queda activo de inmediato y te llega el comprobante
          por correo.
        </li>
        <li>
          El cobro es mensual y se renueva solo. El siguiente sería el{" "}
          <strong style={{ color: "var(--k-t1)" }}>{nextCharge}</strong>.
        </li>
        <li>Precios en pesos mexicanos, más IVA.</li>
      </ul>

      {isDev && mockMode ? (
        <div
          className="mb-6 rounded-xl border p-4"
          style={{
            borderColor: "var(--k-line-2)",
            background: "var(--k-elevated)",
          }}
        >
          <p
            className="font-mono text-[10px] tracking-wider uppercase"
            style={{ color: "var(--k-t3)" }}
          >
            Solo en desarrollo
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            Mercado Pago no está configurado en este entorno, así que el cobro
            se simula y no genera ningún cargo. Este aviso, y la palabra «demo»
            en los botones, no existen en producción.
          </p>
        </div>
      ) : null}

      <CheckoutClient plans={plans} mockMode={mockMode} isDev={isDev} />
    </div>
  );
}
