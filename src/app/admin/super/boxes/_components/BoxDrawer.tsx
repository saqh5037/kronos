"use client";

import { useEffect } from "react";
import type { SuperBoxRow } from "./types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  box: SuperBoxRow | null;
  onClose: () => void;
};

// Formats ISO date string safely (avoids hydration mismatch — no new Date() in render)
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DrawerRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "10px 0",
        borderBottom: "1px solid var(--k-line)",
      }}
    >
      <dt
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          color: "var(--k-t3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--k-t1)",
          margin: 0,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

export function BoxDrawer({ box, onClose }: Props) {
  useEffect(() => {
    if (!box) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [box, onClose]);

  if (!box) return null;

  const location = [box.city, box.country].filter(Boolean).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${box.name}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Panel */}
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-[var(--k-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p
              className="lp-eyebrow"
              style={{
                color: "var(--k-accent)",
                letterSpacing: "0.22em",
                marginBottom: 8,
              }}
            >
              <span className="lp-dot" />
              SUPER-ADMIN · BOX
            </p>
            <h2
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--k-t1)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {box.name}
            </h2>
            <p
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 12,
                color: "var(--k-t3)",
                marginTop: 4,
              }}
            >
              /{box.slug}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="k-btn-ghost px-3 py-1.5 text-xs"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Estado + Plan — destacados */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <StatusBadge status={box.subscriptionStatus} />
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              color: "var(--k-t2)",
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              padding: "2px 10px",
              borderRadius: 999,
            }}
          >
            {box.planName ?? "Sin plan"}
          </span>
        </div>

        {/* Detail rows */}
        <dl style={{ margin: 0 }}>
          <DrawerRow
            label="Owner"
            value={
              <span
                style={{
                  color: box.ownerEmail ? "var(--k-t1)" : "var(--k-t3)",
                }}
              >
                {box.ownerEmail ?? "Sin owner asignado"}
              </span>
            }
          />
          <DrawerRow label="Ubicación" value={location || "—"} />
          <DrawerRow
            label="Atletas"
            value={box.athleteCount.toLocaleString("es-MX")}
          />
          <DrawerRow
            label="Usuarios"
            value={box.userCount.toLocaleString("es-MX")}
          />
          <DrawerRow
            label="Suscripción"
            value={<StatusBadge status={box.subscriptionStatus} />}
          />
          <DrawerRow
            label="Plan SaaS"
            value={
              box.planName ?? (
                <span style={{ color: "var(--k-t3)" }}>Sin plan</span>
              )
            }
          />
          <DrawerRow label="Fecha de alta" value={fmtDate(box.createdAt)} />
        </dl>

        {/* Acciones futuras — placeholder para /build */}
        <div
          style={{
            marginTop: 32,
            padding: 16,
            borderRadius: 12,
            border: "1px dashed var(--k-line-2)",
            background: "var(--k-elevated)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              color: "var(--k-t3)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Acciones de gestión
          </p>
          <p style={{ fontSize: 12, color: "var(--k-t3)" }}>
            Cambio de plan, cancelación y notas internas — disponibles en
            /build.
          </p>
        </div>
      </div>
    </div>
  );
}
