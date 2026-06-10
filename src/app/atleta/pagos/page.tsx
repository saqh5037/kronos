import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { pagosTour } from "@/components/tour/tours/pagos";
import { PagosContent, PagosContentSkeleton } from "./_components/PagosContent";

export const metadata = { title: "Kronos — Mis pagos" };
export const dynamic = "force-dynamic";

export default async function AtletaPagosPage() {
  // Personal Box: el atleta es independiente, no paga membresía a un box.
  // This redirect must stay sync — can't defer it.
  const { isPersonal } = await getBoxMode();
  if (isPersonal) redirect("/atleta");

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
        <AthleteBackLink href="/atleta" label="Inicio" />
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
