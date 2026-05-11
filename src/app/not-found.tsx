import Link from "next/link";

export const metadata = { title: "Página no encontrada — Kronos" };

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--k-bg)" }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: "var(--k-t3)",
            fontSize: 28,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--k-t1)",
            marginBottom: 12,
          }}
        >
          Página no encontrada
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t2)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          La ruta que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="lp-btn-lime"
          style={{ display: "inline-flex" }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
