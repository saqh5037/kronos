import { Suspense } from "react";
import { PencilLine } from "lucide-react";
import { getBoxMode } from "@/server/actions/box-mode";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { WodContentSection } from "./_components/sections/WodContentSection";
import { WodContentSkeleton } from "./skeletons";

export const metadata = { title: "Kronos — WOD del día" };

/**
 * WOD page — streaming version.
 *
 * El atleta independiente (Box Personal) NO se redirige a `/atleta/wod/nuevo`:
 * se le explica aquí mismo. Un `redirect()` a nivel page se resolvía en el
 * cliente DESPUÉS de que `atleta/layout.tsx` ya había streameado su shell
 * (drawer, TabBar dinámico, NotificationBell, InstallPwaBanner), y React veía
 * distinto conteo de hooks entre renders → "Rendered more hooks than during the
 * previous render" (audit 2026-09-15, sección C). Mismo patrón que
 * `wod/nuevo`, `wod/foto` y `programa`, en la dirección inversa. Cubierto por
 * e2e/no-page-errors.spec.ts.
 *
 * Las lecturas pesadas (getWodForDate + listMyScores) siguen diferidas a
 * WodContentSection.
 *
 * searchParams.date: "YYYY-MM-DD" opcional para navegar por día. Por defecto
 * hoy en la zona del Box.
 */
export default async function WODPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { isPersonal } = await getBoxMode();

  if (isPersonal) {
    return (
      <div style={{ paddingBottom: 96 }}>
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div style={{ padding: "24px 20px" }}>
          <EmptyStateCTA
            icon={<PencilLine size={24} aria-hidden />}
            title="Aquí tú programas el WOD"
            description="No tienes coach que suba el WOD del día. Registra lo que entrenaste y Kronos lo guarda en tu historial."
            ctaLabel="Registrar mi WOD"
            ctaHref="/atleta/wod/nuevo"
            secondaryLabel="Subir foto del whiteboard"
            secondaryHref="/atleta/wod/foto"
          />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const dateParam = params.date;

  return (
    <Suspense fallback={<WodContentSkeleton />}>
      <WodContentSection dateParam={dateParam} />
    </Suspense>
  );
}
