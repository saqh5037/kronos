import { Suspense } from "react";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  HistorialContent,
  HistorialContentSkeleton,
} from "./_components/HistorialContent";

export const metadata = { title: "Kronos — Historial" };

export default function HistorialPage() {
  return (
    <>
      {/* BACK LINK — paints immediately */}
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>

      {/* HISTORIAL VIEW — deferred */}
      <Suspense fallback={<HistorialContentSkeleton />}>
        <HistorialContent />
      </Suspense>
    </>
  );
}
