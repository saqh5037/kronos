"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heatmap } from "@/components/charts/Heatmap";
import { subDays, startOfDay } from "date-fns";
import {
  getAthleteDetail,
  updateAthleteProfile,
  type AthleteDetail,
} from "@/server/actions/athletes";
import { AthleteBodyMetrics } from "./AthleteBodyMetrics";
import { kToast } from "@/lib/toast";
import { KModal } from "@/components/kronos/KModal";

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

// ─── Edit form ────────────────────────────────────────────────────────────────

function AthleteEditModal({
  data,
  onClose,
  onSaved,
}: {
  data: AthleteDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [phone, setPhone] = useState(data.phone ?? "");
  const [dob, setDob] = useState(
    data.createdAt ? "" : "", // dob not in AthleteDetail; leave blank unless we fetch
  );
  const [status, setStatus] = useState<string>(data.status);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateAthleteProfile(data.id, {
          firstName,
          lastName,
          phone: phone || undefined,
          dob: dob || undefined,
          status,
        });
        kToast.success("Atleta actualizado");
        router.refresh();
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar");
      }
    });
  }

  return (
    <KModal
      open
      onClose={onClose}
      title="Editar atleta"
      description="Actualiza los datos del perfil."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre *">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={100}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
          <Field label="Apellido *">
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={100}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Teléfono">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        <Field label="Fecha de nacimiento">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        <Field label="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputCls}
            style={inputStyle}
          >
            <option value="ACTIVE">Activo</option>
            <option value="PAUSED">Pausado</option>
            <option value="DROPIN">Drop-in</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </Field>

        {error ? (
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{
              color: "var(--k-danger)",
              background: "rgba(255,90,90,0.08)",
              border: "1px solid rgba(255,90,90,0.25)",
            }}
          >
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2.5 rounded-full font-bold text-sm border disabled:opacity-50"
            style={{ borderColor: "var(--k-line-2)", color: "var(--k-t2)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </KModal>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors";
const inputStyle = {
  background: "var(--k-elevated)",
  borderColor: "var(--k-line-2)",
  color: "var(--k-t1)",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export function AthleteDrawer({ athleteId, onClose }: Props) {
  const [data, setData] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function loadDetail(id: string) {
    setLoading(true);
    setError(null);
    setData(null);
    let cancel = false;
    getAthleteDetail(id)
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
  }

  useEffect(() => {
    if (!athleteId) return;
    return loadDetail(athleteId);
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-stretch justify-end"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />
        <div className="relative h-full w-full max-w-xl overflow-y-auto bg-[var(--k-surface)] p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="k-eyebrow mb-1">Atleta</p>
              <h2 className="font-display text-2xl font-bold">
                {data ? `${data.firstName} ${data.lastName}` : "Cargando…"}
              </h2>
              {data ? (
                <p className="mt-1 text-xs text-[var(--k-t2)]">
                  {data.email ?? "Sin email"} · {data.phone ?? "Sin teléfono"} ·
                  Alta {fmtDate(data.createdAt)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {data ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="k-btn-ghost px-3 py-1.5 text-xs"
                >
                  Editar
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="k-btn-ghost px-3 py-1.5 text-xs"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--k-t2)]">Cargando detalle…</p>
          ) : error ? (
            <p className="text-sm text-[var(--k-danger)]">{error}</p>
          ) : !data ? (
            <p className="text-sm text-[var(--k-t2)]">Atleta no encontrado.</p>
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
                      <span className="font-mono text-[10px] text-[var(--k-t3)]">
                        {data.activeMembership.planType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--k-t2)]">
                      {fmtDate(data.activeMembership.startDate)} →{" "}
                      {fmtDate(data.activeMembership.endDate)}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="font-mono">
                        {data.activeMembership.classesUsed}
                      </span>{" "}
                      <span className="text-[var(--k-t3)]">
                        clases asistidas
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--k-t3)]">
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
                    <p className="text-xs text-[var(--k-t2)]">
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
                    <Heatmap
                      data={heatData}
                      from={heatmapFrom}
                      to={heatmapTo}
                    />
                    <p className="mt-2 text-[10px] text-[var(--k-t3)]">
                      {data.attendanceLast90d.length} clases en el rango
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--k-t3)]">
                    Sin asistencias en los últimos 90 días.
                  </p>
                )}
              </section>

              {/* Body composition */}
              <AthleteBodyMetrics
                athleteId={data.id}
                entries={data.bodyMetricsRecent}
              />

              {/* PRs */}
              <section>
                <p className="k-eyebrow mb-2">PRs recientes</p>
                {data.prsTop.length > 0 ? (
                  <ul className="space-y-1">
                    {data.prsTop.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--k-elevated)]"
                      >
                        <span className="text-sm">{p.movementName}</span>
                        <span className="font-mono text-sm">
                          {p.value} {p.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--k-t3)]">Sin PRs.</p>
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
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--k-elevated)]"
                      >
                        <span className="text-xs text-[var(--k-t2)]">
                          {fmtDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                        </span>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{
                            color:
                              p.status === "PAID"
                                ? "var(--k-accent)"
                                : p.status === "PENDING"
                                  ? "var(--k-warning)"
                                  : "var(--k-t3)",
                          }}
                        >
                          {fmtMoney(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--k-t3)]">Sin pagos.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal — rendered outside the drawer scroll container */}
      {editOpen && data ? (
        <AthleteEditModal
          data={data}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            // Reload detail to reflect changes in the drawer
            if (athleteId) loadDetail(athleteId);
          }}
        />
      ) : null}
    </>
  );
}
