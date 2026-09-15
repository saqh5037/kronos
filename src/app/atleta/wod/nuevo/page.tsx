import { PencilLine } from "lucide-react";
import { getBoxMode } from "@/server/actions/box-mode";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import QuickWodForm from "./QuickWodForm";

export const metadata = { title: "Kronos — Nuevo WOD" };

/**
 * Mini editor de WOD para atletas en Box Personal. Box real usa el flow
 * tradicional (coach programa, atleta solo loggea score en /atleta/wod).
 *
 * El atleta de box NO se redirige: se le explica en su lugar. Un `redirect()`
 * a nivel page se resolvía en el cliente después de que `atleta/layout.tsx`
 * ya había streameado su shell, y React veía distinto conteo de hooks entre
 * renders → "Rendered more hooks than during the previous render"
 * (audit 2026-09-15, sección C). Cubierto por e2e/no-page-errors.spec.ts.
 */
export default async function NuevoWodPage() {
  const { isPersonal } = await getBoxMode();

  if (!isPersonal) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--k-bg)",
          color: "var(--k-t1)",
          fontFamily: "var(--k-font-body)",
          paddingBottom: 96,
        }}
      >
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta/wod" label="WOD del día" />
        </div>
        <div style={{ padding: "24px 20px" }}>
          <EmptyStateCTA
            icon={<PencilLine size={24} aria-hidden />}
            title="Esto es para atletas independientes"
            description="Tu box programa tus WODs, así que no necesitas crearlos. Abre el WOD del día y registra tu resultado."
            ctaLabel="Ver el WOD de hoy"
            ctaHref="/atleta/wod"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        padding: "64px 16px 32px",
        fontFamily: "var(--k-font-body)",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
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
          NUEVO WOD
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "8px 0 4px",
            color: "var(--k-t1)",
          }}
        >
          ¿Qué hiciste hoy?
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "0 0 24px",
          }}
        >
          Anota el WOD y tu resultado en una sola pantalla.
        </p>
        <QuickWodForm />
      </div>
    </div>
  );
}
