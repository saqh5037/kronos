import Link from "next/link";
import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import { listMyScheduledProgramWods } from "@/server/actions/athlete-program";
import ProgramWeekForm from "./_components/ProgramWeekForm";

export const metadata = { title: "Kronos — Programa personal" };
export const dynamic = "force-dynamic";

export default async function ProgramaPage() {
  const { isPersonal } = await getBoxMode();
  if (!isPersonal) redirect("/atleta");

  const upcoming = await listMyScheduledProgramWods().catch(() => []);

  return (
    <div className="pb-28 relative">
      <header style={{ padding: "56px 20px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <Link
            href="/atleta"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--k-t3)",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            ← INICIO
          </Link>
        </div>
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
          PROGRAMA · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textTransform: "uppercase",
            color: "var(--k-t1)",
            margin: "6px 0 0",
          }}
        >
          Tu programa
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            color: "var(--k-t2)",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Carga tu semana de entrenamientos. Cada día verás el WOD que toca en
          tu Inicio.
        </p>
      </header>

      <section style={{ padding: "0 16px 16px" }}>
        <Link
          href="/atleta/wod/foto"
          className="k-tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 12,
            textDecoration: "none",
            color: "inherit",
            boxShadow: "var(--k-accent-glow)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--k-accent-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--k-accent)",
              fontFamily: "var(--k-font-display)",
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            📷
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--k-t1)",
              }}
            >
              Subir foto del whiteboard
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 11,
                color: "var(--k-t3)",
                marginTop: 2,
              }}
            >
              OCR Gemini · 1 WOD por foto
            </div>
          </div>
          <span style={{ color: "var(--k-t3)", fontSize: 18 }}>›</span>
        </Link>
      </section>

      <ProgramWeekForm initialUpcoming={upcoming} />
    </div>
  );
}
