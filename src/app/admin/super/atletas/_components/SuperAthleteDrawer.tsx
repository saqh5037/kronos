"use client";

import { useEffect, useState } from "react";
import { getSuperAthleteDetail } from "@/server/actions/super-athletes";
import type { AthleteDetail } from "@/server/actions/athletes";
import { AthleteStatusBadge } from "./AthleteStatusBadge";

type Props = {
  athleteId: string | null;
  boxName: string | null;
  onClose: () => void;
};

// Safe date formatter — passes locale explicitly to avoid hydration mismatch
function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
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

export function SuperAthleteDrawer({ athleteId, boxName, onClose }: Props) {
  const [data, setData] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    setData(null);

    getSuperAthleteDetail(athleteId)
      .then((result) => {
        if (cancel) return;
        if (result) {
          setData(result);
        } else {
          setError("Atleta no encontrado o sin acceso.");
        }
      })
      .catch((e) => {
        if (!cancel)
          setError(e instanceof Error ? e.message : "Error inesperado");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [athleteId]);

  useEffect(() => {
    if (!athleteId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [athleteId, onClose]);

  if (!athleteId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={
        data
          ? `Detalle de ${data.firstName} ${data.lastName}`
          : "Detalle de atleta"
      }
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
        <div className="mb-4 flex items-start justify-between gap-3">
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
              SUPER-ADMIN · ATLETA
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
              {data ? `${data.firstName} ${data.lastName}` : "Cargando…"}
            </h2>
            {boxName ? (
              <p
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  color: "var(--k-t3)",
                  marginTop: 4,
                }}
              >
                {boxName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="k-btn-ghost px-3 py-1.5 text-xs"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Read-only badge */}
        <div
          className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: "var(--k-accent-soft)",
            color: "var(--k-accent)",
            border: "1px solid var(--k-accent-line)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--k-accent)" }}
          />
          Vista de solo lectura
        </div>

        {loading ? (
          <p className="text-sm text-[var(--k-t2)]">Cargando detalle…</p>
        ) : error ? (
          <p className="text-sm text-[var(--k-danger)]">{error}</p>
        ) : !data ? (
          <p className="text-sm text-[var(--k-t2)]">Atleta no encontrado.</p>
        ) : (
          <div className="space-y-1">
            <dl style={{ margin: 0 }}>
              <DrawerRow
                label="Estado"
                value={<AthleteStatusBadge status={data.status} />}
              />
              <DrawerRow
                label="Email"
                value={
                  <span
                    style={{
                      color: data.email ? "var(--k-t1)" : "var(--k-t3)",
                    }}
                  >
                    {data.email ?? "Sin email"}
                  </span>
                }
              />
              <DrawerRow
                label="Teléfono"
                value={
                  <span
                    style={{
                      color: data.phone ? "var(--k-t1)" : "var(--k-t3)",
                    }}
                  >
                    {data.phone ?? "—"}
                  </span>
                }
              />
              <DrawerRow label="Alta" value={fmtDate(data.createdAt)} />

              {/* Active membership */}
              <DrawerRow
                label="Membresía activa"
                value={
                  data.activeMembership ? (
                    <span>
                      {data.activeMembership.planName}{" "}
                      <span style={{ color: "var(--k-t3)", fontWeight: 400 }}>
                        ({data.activeMembership.planType})
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: "var(--k-t3)", fontWeight: 400 }}>
                      Sin membresía
                    </span>
                  )
                }
              />

              {data.activeMembership ? (
                <>
                  <DrawerRow
                    label="Período"
                    value={`${fmtDate(data.activeMembership.startDate)} → ${fmtDate(data.activeMembership.endDate)}`}
                  />
                  <DrawerRow
                    label="Clases asistidas"
                    value={String(data.activeMembership.classesUsed)}
                  />
                </>
              ) : null}

              {/* Next class */}
              <DrawerRow
                label="Próxima clase"
                value={
                  data.nextClass ? (
                    <span>
                      {data.nextClass.wodName ?? "Open gym"} ·{" "}
                      {fmtDate(data.nextClass.startsAt)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--k-t3)", fontWeight: 400 }}>
                      Sin reserva próxima
                    </span>
                  )
                }
              />

              {/* Attendance */}
              <DrawerRow
                label="Asistencias (90 días)"
                value={String(data.attendanceLast90d.length)}
              />
            </dl>

            {/* PRs */}
            {data.prsTop.length > 0 ? (
              <section style={{ paddingTop: 16 }}>
                <p className="k-eyebrow mb-2">PRs recientes</p>
                <ul className="space-y-1">
                  {data.prsTop.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--k-elevated)]"
                    >
                      <span className="text-sm text-[var(--k-t2)]">
                        {p.movementName}
                      </span>
                      <span className="font-mono text-sm text-[var(--k-t1)]">
                        {p.value} {p.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Link to soporte */}
            <div
              style={{
                marginTop: 28,
                padding: 16,
                borderRadius: 12,
                border: "1px solid var(--k-line-2)",
                background: "var(--k-elevated)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  color: "var(--k-t3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Operaciones
              </p>
              <p style={{ fontSize: 12, color: "var(--k-t2)" }}>
                Para pausar, cancelar membresías o ajustar datos usa el módulo
                de soporte.
              </p>
              <a
                href="/admin/super/soporte"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--k-accent)",
                  background: "var(--k-accent-soft)",
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--k-accent-line)",
                  textDecoration: "none",
                  width: "fit-content",
                }}
              >
                Ir a soporte →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
