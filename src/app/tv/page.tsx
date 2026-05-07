export const metadata = { title: "Kronos — Pantalla del box" };

export default function TVLanding() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center p-8"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="font-display font-bold text-6xl tracking-tight"
        style={{
          background: "var(--k-accent)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        KRONOS
      </div>
      <p className="k-eyebrow mt-4">Pantalla del box</p>
      <p className="mt-6 text-sm max-w-md" style={{ color: "var(--k-t2)" }}>
        Acceder a una pantalla específica:
      </p>
      <code
        className="mt-2 px-3 py-2 rounded-lg font-mono text-sm"
        style={{
          background: "var(--card)",
          color: "var(--k-accent)",
          border: "1px solid var(--line)",
        }}
      >
        /tv/&lt;slug-del-box&gt;
      </code>
      <p className="mt-3 text-xs" style={{ color: "var(--k-t3)" }}>
        Ej: /tv/iron-hands-polanco
      </p>
    </main>
  );
}
