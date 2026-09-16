import Link from "next/link";
import { Camera, ChevronRight, CalendarRange } from "lucide-react";
import { getBoxMode } from "@/server/actions/box-mode";
import { listMyScheduledProgramWods } from "@/server/actions/athlete-program";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import ProgramWeekForm from "./_components/ProgramWeekForm";

export const metadata = { title: "Kronos — Programa personal" };
export const dynamic = "force-dynamic";

/**
 * Programa personal — solo para atletas en Box Personal.
 *
 * El atleta de box NO se redirige: se le explica en su lugar. Un `redirect()`
 * a nivel page se resolvía en el cliente después de que `atleta/layout.tsx`
 * ya había streameado su shell → "Rendered more hooks than during the previous
 * render" (audit 2026-09-15, sección C). Cubierto por
 * e2e/no-page-errors.spec.ts.
 */
export default async function ProgramaPage() {
  const { isPersonal } = await getBoxMode();

  if (!isPersonal) {
    return (
      <div className="pb-28">
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div style={{ padding: "24px 20px" }}>
          <EmptyStateCTA
            icon={<CalendarRange size={24} aria-hidden />}
            title="Esto es para atletas independientes"
            description="Tu box programa tu semana, así que no necesitas cargarla a mano. Revisa las clases disponibles y aparta tu lugar."
            ctaLabel="Ver clases"
            ctaHref="/atleta/reservar"
            secondaryLabel="Ir al inicio"
            secondaryHref="/atleta"
          />
        </div>
      </div>
    );
  }

  const upcoming = await listMyScheduledProgramWods().catch(() => []);

  return (
    <div className="pb-28 relative">
      <header style={{ padding: "48px 20px 16px" }}>
        <div style={{ marginBottom: 4 }}>
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
          PROGRAMA · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textTransform: "uppercase",
            color: "var(--k-t1)",
            margin: "6px 0 0",
          }}
        >
          Tu programa
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            color: "var(--k-t2)",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Carga tu semana de entrenamientos. Cada día verás el WOD que toca en
          tu Inicio.
        </p>
      </header>

      <section style={{ padding: "0 16px 16px" }}>
        <Link
          href="/atleta/wod/foto"
          className="k-tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 12,
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 0 8px rgba(255,255,255,0.06)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--k-elevated)",
              display: "grid",
              placeItems: "center",
              color: "var(--k-t2)",
              flexShrink: 0,
            }}
          >
            <Camera size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--k-t1)",
              }}
            >
              Subir foto del whiteboard
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 11,
                color: "var(--k-t3)",
                marginTop: 2,
              }}
            >
              Sube una foto de la pizarra · 1 WOD por foto
            </div>
          </div>
          <ChevronRight
            size={18}
            aria-hidden
            style={{ color: "var(--k-t3)", flexShrink: 0 }}
          />
        </Link>
      </section>

      <ProgramWeekForm initialUpcoming={upcoming} />
    </div>
  );
}
