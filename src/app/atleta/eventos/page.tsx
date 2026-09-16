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
      {/* BACK LINK — paints immediately. Left gutter keeps it clear of the
          fixed hamburger. */}
      <div className="pl-12 pr-4 lg:pl-4" style={{ paddingTop: 48 }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>

      <div className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
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
            Aquí aparecen tus participaciones y tus resultados.
          </p>
        </header>

        {/* EVENTS LIST — deferred */}
        <Suspense fallback={<EventosContentSkeleton />}>
          <EventosContent />
        </Suspense>
      </div>
    </>
  );
}
