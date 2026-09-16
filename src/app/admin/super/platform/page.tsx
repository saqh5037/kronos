import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { Mail, Tv } from "lucide-react";
import {
  getPlatformStats,
  type PlatformBoxRow,
} from "@/server/actions/super-platform";
import { formatDateLong, formatInt } from "@/lib/format";
import { label } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Plataforma · Kronos super-admin",
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
        padding: "32px 24px 48px",
        color: "var(--k-t1)",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "0 0 8px",
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
          Todos los boxes de Kronos y cómo van.
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
            Todos los boxes ({stats.totalBoxes})
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

function KpiCard({ label: text, value }: { label: string; value: number }) {
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
        {text}
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
        {formatInt(value)}
      </span>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "var(--k-accent)";
    case "TRIAL":
      return "var(--k-t2)";
    case "PAST_DUE":
    case "CANCELLED":
    case "EXPIRED":
      return "var(--k-danger)";
    default:
      return "var(--k-t2)";
  }
}

function StatusChipsCard({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus);

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
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: statusColor(status),
                }}
              >
                {label("subscriptionStatus", status)}
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
  const color = statusColor(box.subscriptionStatus);
  const bg =
    box.subscriptionStatus === "ACTIVE"
      ? "var(--k-accent-soft)"
      : box.subscriptionStatus === "TRIAL"
        ? "var(--k-elevated)"
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
              color,
              background: bg,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {label("subscriptionStatus", box.subscriptionStatus)}
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
        <Metric label="Creado" value={formatDateLong(box.createdAt)} />
        {/* Always rendered: a missing owner is information, not a reason to hide the row */}
        <Metric label="Dueño" value={box.ownerEmail ?? "Sin dueño asignado"} />
      </dl>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--k-line)",
        }}
      >
        <Link
          href={`/tv/${box.slug}` as Route}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--k-accent)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Tv size={13} strokeWidth={2.2} aria-hidden />
          Ver pantalla del box
        </Link>
        {box.ownerEmail ? (
          <a
            href={`mailto:${box.ownerEmail}`}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--k-t2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Mail size={13} strokeWidth={2.2} aria-hidden />
            Escribir al dueño
          </a>
        ) : null}
      </footer>
    </article>
  );
}

function Metric({ label: text, value }: { label: string; value: string }) {
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
        {text}
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
        title={value}
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
        No hay boxes registrados
      </p>
      <p style={{ fontSize: 13, color: "var(--k-t2)" }}>
        La plataforma todavía no tiene ningún box.
      </p>
    </div>
  );
}
