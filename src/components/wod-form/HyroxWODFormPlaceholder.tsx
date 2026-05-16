"use client";

/**
 * Placeholder del editor de WODs Hyrox (F1.4 minimal stub).
 *
 * Cuando un Box con `discipline.slug = "hyrox"` abra `/admin/wods`, esta
 * UI aparece en vez del CrossFit WODForm. La implementación real
 * (stations + race format + splits por estación) llega cuando haya un
 * primer Box Hyrox real en piloto que valide el flujo.
 *
 * Por ahora ofrece copy + acción manual de "Pide la beta del editor
 * Hyrox" — Samuel recibe el ping y lo agenda.
 */
export default function HyroxWODFormPlaceholder() {
  return (
    <div
      className="k-card p-6 max-w-sm"
      style={{
        background: "var(--k-elevated)",
        borderColor: "var(--k-line-2)",
      }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-wider mb-2"
        style={{ color: "var(--k-accent)" }}
      >
        Hyrox · Editor en construcción
      </div>
      <h3
        className="font-display font-bold text-base mb-2"
        style={{ color: "var(--k-t1)" }}
      >
        Editor Hyrox próximamente
      </h3>
      <p className="text-xs mb-3" style={{ color: "var(--k-t2)" }}>
        El editor de WODs Hyrox con stations (SkiErg, Sled Push, RowErg, Burpee
        Broad Jumps, Farmers Carry, Sandbag Lunges, Wall Balls) + race format
        llega pronto. Mientras tanto puedes usar el formato libre del editor
        estándar.
      </p>
      <a
        href="mailto:contacto@kronos-fit.com?subject=Beta%20editor%20Hyrox"
        className="inline-flex items-center text-[11px] font-medium underline"
        style={{ color: "var(--k-accent)" }}
      >
        Pedir acceso a la beta →
      </a>
    </div>
  );
}
