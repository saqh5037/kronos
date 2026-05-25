import type { Metadata } from "next";
import {
  getPlatformStats,
  type PlatformBoxRow,
} from "@/server/actions/super-platform";

export const metadata: Metadata = {
  title: "Platform · Kronos super-admin",
  robots: { index: false, follow: false },
};

export default async function PlatformDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <main
      id="main"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "48px 24px",
        color: "var(--k-t1)",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          className="lp-eyebrow"
          style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
        >
          <span className="lp-dot" />
          SUPER-ADMIN · PLATAFORMA
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
          Plataforma
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
          Métricas globales de la plataforma. Datos actualizados al recargar.
        </p>
      </header>

      {/* KPI row */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
            gap: 12,
          }}
        >
          <KpiCard label="Boxes" value={stats.totalBoxes} />
          <KpiCard label="Atletas" value={stats.totalAthletes} />
          <KpiCard label="Usuarios" value={stats.totalUsers} />
          <StatusChipsCard byStatus={stats.boxesByStatus} />
        </div>
      </section>

      {/* Boxes list */}
      {stats.totalBoxes === 0 ? (
        <EmptyState />
      ) : (
        <section>
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              color: "var(--k-t3)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            Todos los Boxes ({stats.totalBoxes})
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
              gap: 16,
            }}
          >
            {stats.boxes.map((box) => (
              <BoxCard key={box.id} box={box} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
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

function StatusChipsCard({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus);

  const statusColor = (status: string): string => {
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
  };

  return (
    <div
      className="k-card"
      style={{
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
        Por estado
      </span>
      {entries.length === 0 ? (
        <span style={{ fontSize: 13, color: "var(--k-t3)" }}>—</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {entries.map(([status, count]) => (
            <div
              key={status}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  color: statusColor(status),
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {status}
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--k-t1)",
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoxCard({ box }: { box: PlatformBoxRow }) {
  const statusColor =
    box.subscriptionStatus === "ACTIVE"
      ? "var(--k-accent)"
      : box.subscriptionStatus === "TRIAL"
        ? "var(--k-warning)"
        : "var(--k-danger)";

  const statusBg =
    box.subscriptionStatus === "ACTIVE"
      ? "var(--k-accent-soft)"
      : box.subscriptionStatus === "TRIAL"
        ? "rgba(255,176,32,0.1)"
        : "rgba(255,90,90,0.1)";

  return (
    <article
      className="k-card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--k-t1)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {box.name}
          </h2>
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: statusColor,
              background: statusBg,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {box.subscriptionStatus}
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--k-t3)",
            margin: 0,
            fontFamily: "var(--k-font-display)",
          }}
        >
          {box.city ? `${box.city}, ` : ""}
          {box.country} · /{box.slug}
        </p>
      </header>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          margin: 0,
          fontSize: 12,
        }}
      >
        <Metric label="Atletas" value={box.athleteCount.toString()} />
        <Metric label="Usuarios" value={box.userCount.toString()} />
        <Metric
          label="Creado"
          value={box.createdAt.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        />
        {box.ownerEmail && <Metric label="Owner" value={box.ownerEmail} />}
      </dl>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <dt
        style={{
          fontSize: 10,
          color: "var(--k-t3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "var(--k-font-display)",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--k-t1)",
          margin: 0,
          fontFamily: "var(--k-font-display)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
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
        No hay Boxes registrados
      </p>
      <p style={{ fontSize: 13, color: "var(--k-t2)" }}>
        La plataforma aún no tiene ningún Box registrado.
      </p>
    </div>
  );
}
