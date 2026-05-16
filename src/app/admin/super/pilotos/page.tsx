import type { Metadata } from "next";
import Link from "next/link";
import {
  listPilotBoxes,
  type PilotBoxRow,
} from "@/server/actions/super-pilotos";
import CopyMagicLinkButton from "./CopyMagicLinkButton";

export const metadata: Metadata = {
  title: "Pilotos · Kronos super-admin",
  robots: { index: false, follow: false },
};

export default async function PilotosDashboardPage() {
  const pilots = await listPilotBoxes();

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
          SUPER-ADMIN · PILOTOS ACTIVOS
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            margin: "12px 0 8px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--k-t1)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Pilotos {pilots.length > 0 ? `· ${pilots.length}` : ""}
          </h1>
          <Link
            href="/admin/super/pilotos/nuevo"
            className="k-btn-grad"
            style={{
              padding: "10px 20px",
              fontSize: 13,
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            + Crear Box piloto
          </Link>
        </div>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 15,
            color: "var(--k-t2)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Boxes creados via wizard con exclusividad geográfica activa. Métricas
          actualizadas al recargar.
        </p>
      </header>

      {pilots.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {pilots.map((p) => (
            <PilotCard key={p.id} pilot={p} />
          ))}
        </div>
      )}
    </main>
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
        Aún no hay Boxes piloto
      </p>
      <p style={{ fontSize: 13, color: "var(--k-t2)", marginBottom: 20 }}>
        Crea el primero con el wizard de onboarding manual.
      </p>
      <Link
        href="/admin/super/pilotos/nuevo"
        className="k-btn-grad"
        style={{
          padding: "10px 20px",
          fontSize: 13,
          borderRadius: 12,
          fontWeight: 700,
          display: "inline-block",
        }}
      >
        Crear primer Box piloto
      </Link>
    </div>
  );
}

function PilotCard({ pilot }: { pilot: PilotBoxRow }) {
  const signed = pilot.pilotBetaSignedAt !== null;
  const trialExpired =
    pilot.trialEndsAt !== null && pilot.trialDaysLeft === null;
  const exclusivityExpired =
    pilot.pilotExclusivityExpiresAt !== null &&
    pilot.exclusivityDaysLeft === null;

  return (
    <article
      className="k-card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderColor: signed ? "var(--k-accent-line)" : "var(--k-line-2)",
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
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "var(--k-accent)" }}
          >
            {pilot.disciplineName ?? "Sin disciplina"}
          </span>
          <StatusBadge signed={signed} trialExpired={trialExpired} />
        </div>
        <h2
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {pilot.name}
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--k-t3)",
            margin: 0,
            fontFamily: "var(--k-font-plex-mono), monospace",
          }}
        >
          {pilot.city ? `${pilot.city}, ` : ""}
          {pilot.country} · /{pilot.slug}
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
        <Metric
          label="Trial"
          value={
            pilot.trialDaysLeft !== null
              ? `${pilot.trialDaysLeft}d`
              : trialExpired
                ? "vencido"
                : "—"
          }
          tone={
            pilot.trialDaysLeft !== null && pilot.trialDaysLeft <= 3
              ? "warn"
              : "default"
          }
        />
        <Metric
          label="Exclusividad"
          value={
            pilot.exclusivityDaysLeft !== null
              ? `${pilot.exclusivityDaysLeft}d`
              : exclusivityExpired
                ? "vencida"
                : "—"
          }
        />
        <Metric label="Atletas" value={pilot.athleteCount.toString()} />
        <Metric label="WODs" value={pilot.wodCount.toString()} />
        <Metric
          label="Push subs"
          value={pilot.pushSubscriptionCount.toString()}
        />
        <Metric
          label="Firma"
          value={
            signed
              ? pilot.pilotBetaSignedAt!.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })
              : "Pendiente"
          }
          tone={signed ? "ok" : "warn"}
        />
      </dl>

      {pilot.ownerEmail && (
        <p
          style={{
            fontSize: 11,
            color: "var(--k-t3)",
            margin: 0,
            fontFamily: "var(--k-font-plex-mono), monospace",
          }}
        >
          {pilot.ownerEmail}
          {pilot.ownerName ? ` · ${pilot.ownerName}` : ""}
        </p>
      )}

      <footer
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingTop: 6,
          borderTop: "1px solid var(--k-line)",
        }}
      >
        <CopyMagicLinkButton boxId={pilot.id} />
      </footer>
    </article>
  );
}

function StatusBadge({
  signed,
  trialExpired,
}: {
  signed: boolean;
  trialExpired: boolean;
}) {
  const config = signed
    ? {
        label: "Firmado",
        color: "var(--k-accent)",
        bg: "var(--k-accent-soft)",
      }
    : trialExpired
      ? {
          label: "Trial vencido",
          color: "var(--k-danger)",
          bg: "rgba(255,90,90,0.1)",
        }
      : {
          label: "Firma pendiente",
          color: "var(--k-warning)",
          bg: "rgba(255,176,32,0.1)",
        };

  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const valueColor =
    tone === "ok"
      ? "var(--k-accent)"
      : tone === "warn"
        ? "var(--k-warning)"
        : "var(--k-t1)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <dt
        style={{
          fontSize: 10,
          color: "var(--k-t3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "var(--k-font-plex-mono), monospace",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: valueColor,
          margin: 0,
          fontFamily: "var(--k-font-display)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
