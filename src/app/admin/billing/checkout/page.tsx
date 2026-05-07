import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { listSaasPlans } from "@/server/actions/saas-billing";
import { isMockMode } from "@/lib/saas-billing";
import { CheckoutClient } from "./_components/CheckoutClient";

export const metadata = { title: "Kronos — Activar suscripción" };
export const dynamic = "force-dynamic";

export default async function BillingCheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const plans = await listSaasPlans();
  const mockMode = isMockMode();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <p className="k-eyebrow text-[var(--text-3)] mb-2">Activar suscripción</p>
      <h1 className="font-display font-extrabold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.02em] mb-3">
        Elegí tu <em style={{ color: "var(--strain)" }}>plan</em>
      </h1>
      <p className="mb-6 md:mb-8 text-base text-[var(--text-2)] leading-relaxed">
        Mantené tu Box online, sin interrupciones. Podés cambiar de plan o
        cancelar cuando quieras.
        {mockMode && (
          <>
            {" "}
            <strong className="text-[var(--strain)]">
              Modo demo activo:
            </strong>{" "}
            podés simular el pago para activar la suscripción sin cargo real.
          </>
        )}
      </p>

      <CheckoutClient plans={plans} mockMode={mockMode} />
    </div>
  );
}
