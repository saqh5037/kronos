import { Suspense } from "react";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  EventosContent,
  EventosContentSkeleton,
} from "./_components/EventosContent";

export const metadata = { title: "Kronos — Eventos" };
export const dynamic = "force-dynamic";

export default function EventosListPage() {
  return (
    <>
      {/* BACK LINK — paints immediately */}
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>

      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
        {/* HEADER — paints immediately */}
        <header className="mb-6">
          <p className="k-eyebrow" style={{ color: "var(--k-accent)" }}>
            Eventos deportivos
          </p>
          <h1
            className="font-display text-3xl mt-1"
            style={{ color: "var(--k-t1)" }}
          >
            Tus competencias
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: "var(--k-t2)" }}
          >
            Escanea el código QR que reparte el organizador del evento para
            inscribirte. Aquí van a aparecer todas tus participaciones y
            resultados.
          </p>
        </header>

        {/* EVENTS LIST — deferred */}
        <Suspense fallback={<EventosContentSkeleton />}>
          <EventosContent />
        </Suspense>
      </main>
    </>
  );
}
