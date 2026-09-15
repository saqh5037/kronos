import { Suspense } from "react";
import { Wallet } from "lucide-react";
import { getBoxMode } from "@/server/actions/box-mode";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { pagosTour } from "@/components/tour/tours/pagos";
import { PagosContent, PagosContentSkeleton } from "./_components/PagosContent";

export const metadata = { title: "Kronos — Mis pagos" };
export const dynamic = "force-dynamic";

/**
 * Mis membresías — solo tiene sentido en un Box real.
 *
 * El atleta independiente (Box Personal) no paga membresía a nadie, pero NO se
 * redirige a `/atleta`: se le explica en su lugar. Un `redirect()` a nivel page
 * se resolvía en el cliente después de que `atleta/layout.tsx` ya había
 * streameado su shell, y React veía distinto conteo de hooks entre renders →
 * "Rendered more hooks than during the previous render" (audit 2026-09-15,
 * sección C). Cubierto por e2e/no-page-errors.spec.ts.
 */
export default async function AtletaPagosPage() {
  const { isPersonal } = await getBoxMode();

  if (isPersonal) {
    return (
      <div style={{ paddingBottom: 96 }}>
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div style={{ padding: "24px 20px" }}>
          <EmptyStateCTA
            icon={<Wallet size={24} aria-hidden />}
            title="No tienes membresías que pagar"
            description="Entrenas de forma independiente, así que no hay cuota de box ni cobros pendientes. Cuando te unas a un box, tus pagos aparecen aquí."
            ctaLabel="Ir al inicio"
            ctaHref="/atleta"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* HERO — paints immediately after box-mode check */}
      <header
        data-tour="pagos.header"
        style={{
          padding: "48px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 48, right: 20 }}>
          <TourTriggerButton tourId={pagosTour.id} />
        </div>
        {/* Left gutter keeps the back link clear of the fixed hamburger. */}
        <div className="pl-12 lg:pl-0">
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          PAGOS · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Mis membresías
        </h1>
      </header>

      {/* MEMBERSHIPS LIST — deferred */}
      <Suspense fallback={<PagosContentSkeleton />}>
        <PagosContent />
      </Suspense>
    </div>
  );
}
