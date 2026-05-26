import type { Metadata } from "next";
import type { SuperBoxRow, MockState } from "./_components/types";
import { BoxesTable } from "./_components/BoxesTable";
import { BoxesFilters } from "./_components/BoxesFilters";
import { MockStateToggle } from "./_components/MockStateToggle";

// @mock source: getPlatformStats() / listAllBoxesCrossTenant() (a implementar en /build)
import positiveFixture from "@/mocks/super-boxes/positive.json";
import negativeFixture from "@/mocks/super-boxes/negative.json";
import neutralFixture from "@/mocks/super-boxes/neutral.json";

export const metadata: Metadata = {
  title: "Boxes · Kronos super-admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

type SearchParams = {
  __mock?: string;
  page?: string;
  q?: string;
  status?: string;
};

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "var(--k-accent)";
    case "TRIAL":
      return "var(--k-warning)";
    case "PAST_DUE":
    case "CANCELLED":
    case "EXPIRED":
      return "var(--k-danger)";
    default:
      return "var(--k-t2)";
  }
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="k-card"
      style={{
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
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
        {label}
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
        {value.toLocaleString("es-MX")}
      </span>
    </div>
  );
}

function KpiByStatus({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: string;
}) {
  return (
    <div
      className="k-card"
      style={{
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
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
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 32,
          fontWeight: 700,
          color: statusColor(status),
          lineHeight: 1,
        }}
      >
        {value.toLocaleString("es-MX")}
      </span>
    </div>
  );
}

export default async function SuperBoxesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const mockState = (params.__mock ?? "positive") as MockState;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const q = params.q?.toLowerCase() ?? "";
  const statusFilter = params.status ?? "";

  // --- Mock data resolution ---
  // @mock source: in /build, replace with: await listAllBoxesCrossTenant({ page, pageSize: PAGE_SIZE, q, status })
  if (mockState === "negative") {
    const err = negativeFixture as { error: string; message: string };
    const errorTitle: Record<string, string> = {
      INTERNAL_ERROR: "No pudimos cargar los boxes",
      UNAUTHORIZED: "No tienes acceso a esta sección",
      NOT_FOUND: "No se encontró el recurso solicitado",
    };
    const humanTitle = errorTitle[err.error] ?? "Ocurrió un error inesperado";
    const humanMessage =
      err.error === "UNAUTHORIZED"
        ? "Tu sesión no tiene permisos para ver esta sección. Contacta al administrador."
        : "Ocurrió un error al traer la lista. Intenta de nuevo en un momento.";
    return (
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px",
          color: "var(--k-t1)",
        }}
      >
        <PageHeader />
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
            {humanTitle}
          </p>
          <p style={{ fontSize: 13, color: "var(--k-t2)", marginBottom: 20 }}>
            {humanMessage}
          </p>
          <a
            href="/admin/super/boxes"
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
        <MockStateToggle />
      </main>
    );
  }

  const fixture = mockState === "neutral" ? neutralFixture : positiveFixture;
  const allBoxes = fixture.boxes as SuperBoxRow[];
  const kpis = fixture.kpis;

  // Client-side filter simulation (in /build, filters go to the server action)
  const filtered = allBoxes.filter((b) => {
    const matchQ =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.ownerEmail ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || b.subscriptionStatus === statusFilter;
    return matchQ && matchStatus;
  });

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Is filtering active with no results?
  const isFiltering = !!q || !!statusFilter;

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "48px 24px",
        color: "var(--k-t1)",
      }}
    >
      <PageHeader />

      {/* KPI row */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: 12,
          }}
        >
          <KpiCard label="Total boxes" value={kpis.totalBoxes} />
          <KpiByStatus label="Activos" value={kpis.active} status="ACTIVE" />
          <KpiByStatus label="En trial" value={kpis.trial} status="TRIAL" />
          <KpiByStatus
            label="Inactivos"
            value={kpis.expired}
            status="EXPIRED"
          />
        </div>
      </section>

      {/* Filters */}
      <BoxesFilters />

      {/* Table or empty state */}
      {isFiltering && total === 0 ? (
        <div
          className="k-card"
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--k-elevated)",
            borderColor: "var(--k-line-2)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--k-t1)",
              marginBottom: 8,
            }}
          >
            Sin resultados
          </p>
          <p style={{ fontSize: 13, color: "var(--k-t2)" }}>
            No hay boxes que coincidan con los filtros actuales.
          </p>
        </div>
      ) : (
        <BoxesTable
          rows={paged}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      )}

      {/* Dev-only mock toggle */}
      <MockStateToggle />
    </main>
  );
}

function PageHeader() {
  return (
    <header style={{ marginBottom: 32 }}>
      <p
        className="lp-eyebrow"
        style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
      >
        <span className="lp-dot" />
        SUPER-ADMIN · BOXES
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
        Boxes
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
        Gestión cross-tenant de todos los boxes registrados en la plataforma.
      </p>
    </header>
  );
}
