import { Suspense } from "react";
import { MovimientosContentSection } from "./_components/sections/MovimientosContentSection";
import { MovimientosContentSkeleton } from "./skeletons";

export const metadata = { title: "Kronos — Mis Movimientos" };

/**
 * Movimientos page — streaming version.
 * Both fetches (listMyMovementsRated + listMovements) are deferred to
 * MovimientosContentSection so the shell paints immediately.
 */
export default function MovementsPage() {
  return (
    <Suspense fallback={<MovimientosContentSkeleton />}>
      <MovimientosContentSection />
    </Suspense>
  );
}
