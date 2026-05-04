export const metadata = { title: "Kronos — Pantalla del box" };

export default function TVPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="font-display font-bold text-6xl tracking-tight"
        style={{
          background: "var(--grad)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        KRONOS
      </div>
      <p className="k-eyebrow mt-4">Pantalla del box — Fase 2</p>
    </main>
  );
}
