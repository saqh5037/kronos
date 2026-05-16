import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import KCard from "@/components/kronos/KCard";
import KronosLogo from "@/components/brand/KronosLogo";
import {
  isDominusPromoActive,
  promoDaysLeft,
  PROMO_EVENT_DATE,
  PROMO_EVENT_URL,
} from "@/lib/dominus-promo";
import FoundingForm from "./FoundingForm";

export const metadata: Metadata = {
  title: "Founding Box Dominus · Kronos",
  description:
    "Lanzamiento Kronos en Dominus 23-may. Lock-in de precio fundador 12 meses + 3 meses gratis al pagar anual. Cupos limitados.",
  alternates: {
    canonical: "https://www.kronos-fit.com/founding-dominus",
  },
  openGraph: {
    title: "Founding Box Dominus · Kronos",
    description:
      "Lanzamiento Kronos en Dominus MX el 23 de mayo. Precio fundador 12 meses + 3 meses gratis al pagar anual. Cupos limitados.",
    url: "https://www.kronos-fit.com/founding-dominus",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Founding Box Dominus · Kronos",
    description:
      "Lock-in precio fundador 12 meses + 3 gratis. Lanzamiento en Dominus MX, 23 de mayo. Cupos limitados.",
  },
};

export default async function FoundingDominusPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect(session.user.role === "ATHLETE" ? "/atleta" : "/admin");
  }

  const active = isDominusPromoActive();
  const days = promoDaysLeft();

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <main
        id="main"
        className="min-h-screen"
        style={{ background: "var(--k-bg)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <header className="text-center mb-10">
            <div className="inline-flex mb-4">
              <KronosLogo variant="mark" size={56} />
            </div>
            {active ? (
              <div
                className="inline-block text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                style={{
                  background: "var(--k-accent-soft)",
                  border: "1px solid var(--k-accent-line)",
                  color: "var(--k-accent)",
                }}
              >
                · {days === 1 ? "1 día" : `${days} días`} · Founding Box Dominus
              </div>
            ) : (
              <div
                className="inline-block text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                style={{
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line-2)",
                  color: "var(--k-t3)",
                }}
              >
                Promo cerrada
              </div>
            )}
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-[-0.01em]">
              {active ? "Founding Box Dominus" : "Esta promo terminó"}
            </h1>
            <p
              className="mt-3 text-sm md:text-base max-w-xl mx-auto"
              style={{ color: "var(--k-t2)" }}
            >
              {active ? (
                <>
                  Lanzamiento Kronos en{" "}
                  <a
                    href={PROMO_EVENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--k-accent)" }}
                  >
                    Dominus MX
                  </a>{" "}
                  · {PROMO_EVENT_DATE}. Lock-in de precio fundador 12 meses + 3
                  meses gratis al pagar anual. Cupos limitados.
                </>
              ) : (
                <>
                  El Founding Box Dominus se cerró el {PROMO_EVENT_DATE}.
                  Mantenemos la lista de interesados para próximas promos —
                  escríbenos a{" "}
                  <a
                    href="mailto:contacto@kronos-fit.com"
                    className="underline"
                    style={{ color: "var(--k-accent)" }}
                  >
                    contacto@kronos-fit.com
                  </a>
                  .
                </>
              )}
            </p>
          </header>

          {active ? (
            <>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
                <BenefitCard
                  eyebrow="Lock-in"
                  title="Precio fundador 12 meses"
                  desc="$3,500 MXN/mes. Sin aumentos hasta mayo 2027 sin importar cuándo procesemos el pago."
                />
                <BenefitCard
                  eyebrow="Anual"
                  title="3 meses gratis"
                  desc="Pagas 12 meses upfront, recibes 15. La forma más eficiente de asegurar el precio."
                />
                <BenefitCard
                  eyebrow="Founding"
                  title="Onboarding 1-a-1"
                  desc="Sesión privada para configurar tu Box: horarios, atletas, plan de membresías. Soporte directo."
                />
              </section>

              <KCard animate={false}>
                <div className="p-6 md:p-8">
                  <h2 className="font-display font-bold text-xl mb-1">
                    Reservá tu Box
                  </h2>
                  <p className="text-sm mb-6" style={{ color: "var(--k-t2)" }}>
                    Sin cargo hoy. Te llegan 2 correos: confirmación + magic
                    link para entrar al sistema.
                  </p>
                  <FoundingForm />
                </div>
              </KCard>

              <section className="mt-12">
                <h3 className="font-display font-bold text-lg mb-4">
                  Preguntas frecuentes
                </h3>
                <div className="space-y-3">
                  <FaqItem
                    q="¿Por qué no me cobran hoy?"
                    a="MercadoPago todavía está en proceso de activación. Reservas tu Box al precio fundador y cuando esté listo te mandamos el link de pago — el precio queda lockeado sin importar la fecha."
                  />
                  <FaqItem
                    q="¿Qué pasa si no quiero seguir tras el trial?"
                    a="Tienes 14 días gratis para explorar. Si no procesas el pago cuando llegue el link, simplemente no se activa la suscripción. Sin cargos sorpresa."
                  />
                  <FaqItem
                    q="¿Cuántos atletas puedo tener?"
                    a="Hasta 200 atletas y 5 coaches en el plan Founding. Si necesitas más, hablamos."
                  />
                  <FaqItem
                    q="¿La oferta se extiende después del 23-may?"
                    a="No. La promoción Founding Dominus se cierra a las 23:59 (CDMX) del 23 de mayo. Después el plan vuelve al precio regular."
                  />
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

function BenefitCard({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "var(--k-surface)",
        borderColor: "var(--k-line-2)",
      }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-wider mb-2"
        style={{ color: "var(--k-accent)" }}
      >
        {eyebrow}
      </div>
      <div
        className="font-display font-bold text-base mb-2"
        style={{ color: "var(--k-t1)" }}
      >
        {title}
      </div>
      <div className="text-xs leading-relaxed" style={{ color: "var(--k-t2)" }}>
        {desc}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="rounded-xl border p-4 [&[open]_summary_svg]:rotate-180"
      style={{
        background: "var(--k-surface)",
        borderColor: "var(--k-line-2)",
      }}
    >
      <summary
        className="cursor-pointer flex items-center justify-between gap-2 font-medium text-sm list-none"
        style={{ color: "var(--k-t1)" }}
      >
        {q}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform"
          style={{ color: "var(--k-t3)" }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "var(--k-t2)" }}
      >
        {a}
      </p>
    </details>
  );
}
