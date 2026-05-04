export const metadata = { title: "Kronos — Ajustes" };

export default function AjustesPage() {
  return (
    <div className="p-8">
      <p className="k-eyebrow mb-2">Módulo</p>
      <h1 className="font-display font-bold text-3xl tracking-tight">
        Ajustes
      </h1>
      <div
        className="mt-6 p-4 rounded-xl border"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Este módulo está en desarrollo — llegará en Fase 1.
        </p>
      </div>
    </div>
  );
}
