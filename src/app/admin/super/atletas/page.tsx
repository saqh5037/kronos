import type { Metadata } from "next";
import {
  listAllAthletesCrossTenant,
  listAllBoxesForFilter,
} from "@/server/actions/super-athletes";
import { SuperAthletesTable } from "./_components/SuperAthletesTable";

export const metadata: Metadata = {
  title: "Atletas · Kronos super-admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

export default async function SuperAtletasPage() {
  let loadError: string | null = null;
  let initialRows = [] as Awaited<
    ReturnType<typeof listAllAthletesCrossTenant>
  >["rows"];
  let initialTotal = 0;
  let boxes = [] as Awaited<ReturnType<typeof listAllBoxesForFilter>>;

  try {
    const [athleteResult, boxResult] = await Promise.all([
      listAllAthletesCrossTenant({ page: 1, pageSize: PAGE_SIZE }),
      listAllBoxesForFilter(),
    ]);
    initialRows = athleteResult.rows;
    initialTotal = athleteResult.total;
    boxes = boxResult;
  } catch {
    loadError = "No se pudo cargar la lista de atletas. Intenta de nuevo.";
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "48px 24px",
        color: "var(--k-t1)",
      }}
    >
      <PageHeader totalAthletes={initialTotal} />

      {loadError ? (
        <ErrorState message={loadError} />
      ) : (
        <SuperAthletesTable
          initialRows={initialRows}
          initialTotal={initialTotal}
          boxes={boxes}
        />
      )}
    </main>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({ totalAthletes }: { totalAthletes: number }) {
  return (
    <>
      <header style={{ marginBottom: 32 }}>
        <p
          className="lp-eyebrow"
          style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
        >
          <span className="lp-dot" />
          SUPER-ADMIN · ATLETAS
        </p>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "12px 0 8px",
            lineHeight: 1.1,
          }}
        >
          Atletas
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 15,
            color: "var(--k-t2)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Vista cross-tenant de todos los atletas registrados en la plataforma.
        </p>
      </header>

      {/* KPI — total atletas */}
      {totalAthletes > 0 ? (
        <section style={{ marginBottom: 32 }}>
          <div
            className="k-card"
            style={{
              padding: "20px 24px",
              display: "inline-flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 180,
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                color: "var(--k-t3)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Total atletas
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 32,
                fontWeight: 700,
                color: "var(--k-t1)",
                lineHeight: 1,
              }}
            >
              {totalAthletes.toLocaleString("es-MX")}
            </span>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="k-card"
      style={{
        padding: 48,
        textAlign: "center",
        background: "var(--k-elevated)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--k-danger)",
          marginBottom: 8,
        }}
      >
        No pudimos cargar los atletas
      </p>
      <p style={{ fontSize: 13, color: "var(--k-t2)", marginBottom: 20 }}>
        {message}
      </p>
      <a
        href="/admin/super/atletas"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--k-font-display)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--k-accent)",
          background: "var(--k-accent-soft)",
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid var(--k-accent-line)",
          textDecoration: "none",
        }}
      >
        Reintentar
      </a>
    </div>
  );
}
