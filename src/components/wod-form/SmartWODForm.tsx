"use client";

import dynamic from "next/dynamic";
import WODForm from "@/components/WODForm";

/**
 * Smart WOD form selector que escoge el editor por disciplina del Box.
 *
 * - CrossFit (default + fallback): renderiza el WODForm clásico inline,
 *   no se splittea — es el path caliente.
 * - Hyrox: carga el placeholder via next/dynamic con ssr:false. Esto
 *   permite que el código del editor Hyrox (que va a crecer cuando se
 *   implemente con stations + race format) NO entre en el bundle base
 *   admin. Sólo se descarga cuando un Box Hyrox usuario lo abre.
 *
 * F1.4 minimal stub: el bundle splitting + dynamic wiring está armado;
 * la UI Hyrox real se llena en su propio sprint.
 */

type Movement = {
  id: string;
  name: string;
  equipment: string[];
};

const HyroxWODFormPlaceholder = dynamic(
  () => import("./HyroxWODFormPlaceholder"),
  {
    ssr: false,
    loading: () => (
      <div className="k-card p-6 text-xs" style={{ color: "var(--k-t3)" }}>
        Cargando editor Hyrox…
      </div>
    ),
  },
);

export default function SmartWODForm({
  movements,
  disciplineSlug,
}: {
  movements: Movement[];
  disciplineSlug?: string | null;
}) {
  if (disciplineSlug === "hyrox") {
    return <HyroxWODFormPlaceholder />;
  }
  // Default + retrocompat: CrossFit editor inline. Si discipline es null
  // (Box pre-F1.1 sin backfill) o cualquier otro slug, caemos al estándar.
  return <WODForm movements={movements} />;
}
