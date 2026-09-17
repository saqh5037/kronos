/**
 * MovimientosContentSection — the athlete's movement library.
 *
 * Audit 2026-09-15: this route stitched two products vertically (a 14-row
 * "trained" ranking, then a 52-card library whose search and filters sat
 * ~1,500 px down). The library is now the page and "Entrenados" is a filter
 * chip at the top; both datasets are still fetched in parallel and handed to
 * one client component.
 */

import {
  listMyMovementsRated,
  type RankedMovement,
} from "@/server/analytics/movement";
import { listMovements, type MovementRow } from "@/server/actions/movements";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { movimientosTour } from "@/components/tour/tours/movimientos";
import { getCachedSession } from "@/server/session";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import MovementLibrary from "../MovementLibrary";

export async function MovimientosContentSection() {
  let movements: RankedMovement[] = [];
  let catalog: MovementRow[] = [];
  let tenantId = "";
  let userId = "";
  try {
    const session = await getCachedSession();
    tenantId = session?.user?.tenantId ?? "";
    userId = session?.user?.id ?? "";
    [movements, catalog] = await Promise.all([
      listMyMovementsRated(50),
      listMovements(),
    ]);
  } catch {
    // no session
  }

  return (
    <div className="pb-28 relative">
      <header
        data-tour="movimientos.header"
        style={{
          padding: "56px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
        }}
      >
        {/* Left gutter keeps the back link clear of the fixed hamburger. */}
        <div className="pl-12 lg:pl-0" style={{ marginBottom: 4 }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div style={{ position: "absolute", top: 56, right: 20 }}>
          <TourTriggerButton tourId={movimientosTour.id} />
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
          MOVIMIENTOS · ATLETA
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
          Tu biblioteca técnica
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--k-t2)",
            margin: "4px 0 0",
          }}
        >
          {catalog.length} movimientos · {movements.length} entrenados en 90
          días
        </p>
      </header>

      <section data-tour="movimientos.catalogo" className="px-3.5">
        <MovementLibrary
          tenantId={tenantId}
          userId={userId}
          initialCatalog={catalog}
          trained={movements}
        />
      </section>
    </div>
  );
}
