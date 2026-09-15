import { Camera } from "lucide-react";
import { getBoxMode } from "@/server/actions/box-mode";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import PhotoWodFlow from "./PhotoWodFlow";

export const metadata = { title: "Kronos — Foto del whiteboard" };

/**
 * Foto del whiteboard → OCR → review → guardar como WOD propio.
 * Solo Box Personal. Box real usa el flow del coach (whiteboard upload con
 * roster matching).
 *
 * El atleta de box NO se redirige: se le explica en su lugar. Ver el comentario
 * en `wod/nuevo/page.tsx` y la sección C del audit 2026-09-15 — el
 * `redirect()` a nivel page provocaba "Rendered more hooks than during the
 * previous render". Cubierto por e2e/no-page-errors.spec.ts.
 */
export default async function PhotoWodPage() {
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
            icon={<Camera size={24} aria-hidden />}
            title="Esto es para atletas independientes"
            description="En tu box el coach sube la foto del whiteboard y Kronos reparte los scores. Abre el WOD del día para registrar el tuyo."
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
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          <Camera size={12} aria-hidden />
          FOTO DEL WHITEBOARD
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
          Toma una foto del WOD
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "0 0 24px",
          }}
        >
          Lo leemos automáticamente. Después confirmas los datos y se guarda.
        </p>
        <PhotoWodFlow />
      </div>
    </div>
  );
}
