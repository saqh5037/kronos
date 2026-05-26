"use client";

import { useEffect, useState } from "react";
import { Heatmap } from "@/components/charts/Heatmap";
import { subDays, startOfDay } from "date-fns";
import {
  getSupportAthleteDetail,
  updateAthleteStatusAsSupport,
  pauseMembershipAsSupport,
  resumeMembershipAsSupport,
  cancelMembershipAsSupport,
  voidPaymentAsSupport,
  cancelBookingAsSupport,
  checkInAthleteAsSupport,
  markNoShowAsSupport,
} from "@/server/actions/support";
import type { AthleteDetail } from "@/server/actions/athletes";
import type { AthleteStatus } from "@prisma/client";
import { useConfirm } from "@/lib/use-confirm";

type Props = {
  athleteId: string | null;
  onClose: () => void;
  onActionComplete: () => void;
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

function ActionBtn({
  children,
  onClick,
  variant = "ghost",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "ghost" | "warning" | "danger";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    ghost: {
      background: "var(--k-elevated)",
      color: "var(--k-t2)",
      border: "1px solid var(--k-line-2)",
    },
    warning: {
      background: "rgba(255,176,32,0.10)",
      color: "var(--k-warning)",
      border: "1px solid rgba(255,176,32,0.35)",
    },
    danger: {
      background: "rgba(255,90,90,0.10)",
      color: "var(--k-danger)",
      border: "1px solid rgba(255,90,90,0.35)",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function SupportAthleteDrawer({
  athleteId,
  onClose,
  onActionComplete,
}: Props) {
  const confirm = useConfirm();
  const [data, setData] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!athleteId) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    setData(null);
    setActionError(null);

    getSupportAthleteDetail(athleteId)
      .then((result) => {
        if (cancel) return;
        if (result.ok) {
          setData(result.athlete);
        } else {
          setError(`Error al cargar el atleta: ${result.error}`);
        }
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

  async function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setActionError(null);
    try {
      const result = await fn();
      if (!result.ok) {
        setActionError(`Error: ${result.error ?? "Operación fallida"}`);
        return false;
      }
      onActionComplete();
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error inesperado");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status: AthleteStatus) {
    if (!data) return;
    const ok = await confirm({
      title: `Cambiar estado a ${status}`,
      message: `¿Estás seguro de cambiar el estado de ${data.firstName} ${data.lastName} a ${status}?`,
      confirmLabel: "Confirmar",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;
    await runAction(() => updateAthleteStatusAsSupport(data.id, status));
  }

  async function handlePauseMembership() {
    if (!data?.activeMembership) return;
    const ok = await confirm({
      title: "Pausar membresía",
      message: `¿Pausar la membresía "${data.activeMembership.planName}" de ${data.firstName}?`,
      confirmLabel: "Pausar",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;
    await runAction(() => pauseMembershipAsSupport(data.activeMembership!.id));
  }

  async function handleResumeMembership() {
    if (!data?.activeMembership) return;
    await runAction(() => resumeMembershipAsSupport(data.activeMembership!.id));
  }

  async function handleCancelMembership() {
    if (!data?.activeMembership) return;
    const ok = await confirm({
      title: "Cancelar membresía",
      message: `Esta acción cancelará la membresía "${data.activeMembership.planName}" de ${data.firstName} ${data.lastName}. Esta acción no se puede deshacer fácilmente.`,
      confirmLabel: "Cancelar membresía",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    await runAction(() => cancelMembershipAsSupport(data.activeMembership!.id));
  }

  async function handleVoidPayment(paymentId: string) {
    const ok = await confirm({
      title: "Anular pago",
      message:
        "¿Anular este pago? El estado cambiará a REFUNDED. No se puede deshacer.",
      confirmLabel: "Anular pago",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;
    await runAction(() => voidPaymentAsSupport(paymentId));
  }

  async function handleCancelBooking(bookingId: string) {
    const ok = await confirm({
      title: "Cancelar reserva",
      message: "¿Cancelar esta reserva?",
      confirmLabel: "Cancelar reserva",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    await runAction(() => cancelBookingAsSupport(bookingId));
  }

  async function handleCheckIn(bookingId: string) {
    await runAction(() => checkInAthleteAsSupport(bookingId));
  }

  async function handleNoShow(bookingId: string) {
    const ok = await confirm({
      title: "Marcar como no-show",
      message: "¿Marcar a este atleta como no-show en esta reserva?",
      confirmLabel: "Marcar no-show",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;
    await runAction(() => markNoShowAsSupport(bookingId));
  }

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
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-[var(--k-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="k-eyebrow mb-1" style={{ color: "var(--k-warning)" }}>
              Soporte · Atleta
            </p>
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
          <button
            type="button"
            onClick={onClose}
            className="k-btn-ghost px-3 py-1.5 text-xs"
          >
            Cerrar
          </button>
        </div>

        {/* Support badge */}
        <div
          className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: "rgba(255,176,32,0.12)",
            color: "var(--k-warning)",
            border: "1px solid rgba(255,176,32,0.3)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--k-warning)" }}
          />
          Vista de soporte
        </div>

        {loading ? (
          <p className="text-sm text-[var(--k-t2)]">Cargando detalle…</p>
        ) : error ? (
          <p className="text-sm text-[var(--k-danger)]">{error}</p>
        ) : !data ? (
          <p className="text-sm text-[var(--k-t2)]">Atleta no encontrado.</p>
        ) : (
          <div className="space-y-5">
            {/* Action error */}
            {actionError && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  background: "rgba(255,90,90,0.08)",
                  borderColor: "rgba(255,90,90,0.3)",
                  color: "var(--k-danger)",
                }}
              >
                {actionError}
              </div>
            )}

            {/* Status */}
            <section>
              <p className="k-eyebrow mb-2">Estado del atleta</p>
              <div className="k-card-flat p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--k-t1)]">
                    {data.status}
                  </span>
                  <span className="text-xs text-[var(--k-t3)]">
                    · Cambiar a:
                  </span>
                  {(["ACTIVE", "PAUSED", "CANCELLED"] as AthleteStatus[])
                    .filter((s) => s !== data.status)
                    .map((s) => (
                      <ActionBtn
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={busy}
                        variant={
                          s === "ACTIVE"
                            ? "ghost"
                            : s === "PAUSED"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {s}
                      </ActionBtn>
                    ))}
                </div>
              </div>
            </section>

            {/* Membership */}
            <section>
              <p className="k-eyebrow mb-2">Membresía activa</p>
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
                    <span className="text-[var(--k-t3)]">clases asistidas</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionBtn
                      onClick={handlePauseMembership}
                      disabled={busy}
                      variant="warning"
                    >
                      Pausar membresía
                    </ActionBtn>
                    <ActionBtn onClick={handleResumeMembership} disabled={busy}>
                      Reanudar
                    </ActionBtn>
                    <ActionBtn
                      onClick={handleCancelMembership}
                      disabled={busy}
                      variant="danger"
                    >
                      Cancelar membresía
                    </ActionBtn>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--k-t3)]">
                  Sin membresía activa.
                </p>
              )}
            </section>

            {/* Next class */}
            {data.nextClass ? (
              <section>
                <p className="k-eyebrow mb-2">Próxima clase</p>
                <div className="k-card-flat p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                    <div className="flex flex-wrap gap-2">
                      <ActionBtn
                        onClick={() => handleCheckIn(data.nextClass!.bookingId)}
                        disabled={busy}
                      >
                        Check-in
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => handleNoShow(data.nextClass!.bookingId)}
                        disabled={busy}
                        variant="warning"
                      >
                        No-show
                      </ActionBtn>
                      <ActionBtn
                        onClick={() =>
                          handleCancelBooking(data.nextClass!.bookingId)
                        }
                        disabled={busy}
                        variant="danger"
                      >
                        Cancelar reserva
                      </ActionBtn>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Attendance heatmap */}
            <section>
              <p className="k-eyebrow mb-2">Asistencia · últimos 90 días</p>
              {data.attendanceLast90d.length > 0 ? (
                <div className="k-card-flat p-3">
                  <Heatmap data={heatData} from={heatmapFrom} to={heatmapTo} />
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
                      <div>
                        <span className="text-xs text-[var(--k-t2)]">
                          {fmtDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                        {p.status === "PAID" && (
                          <ActionBtn
                            onClick={() => handleVoidPayment(p.id)}
                            disabled={busy}
                            variant="danger"
                          >
                            Anular
                          </ActionBtn>
                        )}
                      </div>
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
  );
}
