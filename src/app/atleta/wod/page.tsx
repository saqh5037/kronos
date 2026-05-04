export const metadata = { title: "Kronos — WOD del día" };

export default function WODPage() {
  return (
    <div className="p-4 pt-16">
      <p className="k-eyebrow mb-2">WOD</p>
      <h1 className="font-display font-bold text-3xl">WOD del día</h1>
      <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
        Porting del diseño en Fase 1.
      </p>
    </div>
  );
}
