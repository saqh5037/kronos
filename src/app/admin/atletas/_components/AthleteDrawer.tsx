"use client";

import { useEffect, useState } from "react";
import { Heatmap } from "@/components/charts/Heatmap";
import { subDays, startOfDay } from "date-fns";
import {
  getAthleteDetail,
  type AthleteDetail,
} from "@/server/actions/athletes";

type Props = {
  athleteId: string | null;
  onClose: () => void;
};

const fmtDate = (d: Date | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtMoney = (v: number) => `$${v.toLocaleString("es-MX")}`;

export function AthleteDrawer({ athleteId, onClose }: Props) {
  const [data, setData] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    setData(null);
    getAthleteDetail(athleteId)
      .then((d) => {
        if (!cancel) setData(d);
      })
      .catch((e) => {
        if (!cancel) setError(e instanceof Error ? e.message : "Error");
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

  const heatmapTo = new Date();
  const heatmapFrom = startOfDay(subDays(heatmapTo, 89));
  const heatData =
    data?.attendanceLast90d.map((a) => ({ date: a.date, value: 1 })) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--overlay)]"
      />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-[var(--card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="k-eyebrow mb-1">Atleta</p>
            <h2 className="font-display text-2xl font-bold">
              {data ? `${data.firstName} ${data.lastName}` : "Cargando…"}
            </h2>
            {data ? (
              <p className="mt-1 text-xs text-[var(--text-2)]">
                {data.email ?? "Sin email"} · {data.phone ?? "Sin teléfono"} ·
                Alta {fmtDate(data.createdAt)}
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

        {loading ? (
          <p className="text-sm text-[var(--text-2)]">Cargando detalle…</p>
        ) : error ? (
          <p className="text-sm text-[var(--pr)]">{error}</p>
        ) : !data ? (
          <p className="text-sm text-[var(--text-2)]">Atleta no encontrado.</p>
        ) : (
          <div className="space-y-5">
            {/* Membership */}
            <section>
              <p className="k-eyebrow mb-2">Membership activa</p>
              {data.activeMembership ? (
                <div className="k-card-flat p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">
                      {data.activeMembership.planName}
                    </p>
                    <span className="font-mono text-[10px] text-[var(--text-3)]">
                      {data.activeMembership.planType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-2)]">
                    {fmtDate(data.activeMembership.startDate)} →{" "}
                    {fmtDate(data.activeMembership.endDate)}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className="font-mono">
                      {data.activeMembership.classesUsed}
                    </span>{" "}
                    <span className="text-[var(--text-3)]">
                      clases asistidas
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-3)]">
                  Sin membership activa.
                </p>
              )}
            </section>

            {/* Next class */}
            {data.nextClass ? (
              <section>
                <p className="k-eyebrow mb-2">Próxima clase</p>
                <div className="k-card-flat p-3">
                  <p className="font-semibold">
                    {data.nextClass.wodName ?? "Open gym"}
                  </p>
                  <p className="text-xs text-[var(--text-2)]">
                    {fmtDate(data.nextClass.startsAt)} ·{" "}
                    {new Date(data.nextClass.startsAt).toLocaleTimeString(
                      "es-MX",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </p>
                </div>
              </section>
            ) : null}

            {/* Attendance heatmap */}
            <section>
              <p className="k-eyebrow mb-2">Asistencia · últimos 90 días</p>
              {data.attendanceLast90d.length > 0 ? (
                <div className="k-card-flat p-3">
                  <Heatmap data={heatData} from={heatmapFrom} to={heatmapTo} />
                  <p className="mt-2 text-[10px] text-[var(--text-3)]">
                    {data.attendanceLast90d.length} clases en el rango
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-3)]">
                  Sin asistencias en los últimos 90 días.
                </p>
              )}
            </section>

            {/* PRs */}
            <section>
              <p className="k-eyebrow mb-2">PRs recientes</p>
              {data.prsTop.length > 0 ? (
                <ul className="space-y-1">
                  {data.prsTop.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--hover-subtle)]"
                    >
                      <span className="text-sm">{p.movementName}</span>
                      <span className="font-mono text-sm">
                        {p.value} {p.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-3)]">Sin PRs.</p>
              )}
            </section>

            {/* Payments */}
            <section>
              <p className="k-eyebrow mb-2">Pagos recientes</p>
              {data.paymentsRecent.length > 0 ? (
                <ul className="space-y-1">
                  {data.paymentsRecent.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--hover-subtle)]"
                    >
                      <span className="text-xs text-[var(--text-2)]">
                        {fmtDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                      </span>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{
                          color:
                            p.status === "PAID"
                              ? "var(--recovery)"
                              : p.status === "PENDING"
                                ? "var(--strain)"
                                : "var(--text-3)",
                        }}
                      >
                        {fmtMoney(p.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-3)]">Sin pagos.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
