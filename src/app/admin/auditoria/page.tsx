import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getOwnerLiveFeed } from "@/server/actions/owner-feed";
import type { FeedEvent, FeedSeverity } from "@/server/actions/owner-feed";
import type { AuditAction } from "@prisma/client";

export const metadata = { title: "Kronos — Auditoría" };

const ACTION_ICONS: Partial<Record<AuditAction, string>> = {
  PAYMENT_REGISTERED: "💰",
  PAYMENT_VOIDED: "↩️",
  PAYMENT_INITIATED: "🏦",
  PAYMENT_CONFIRMED: "✅",
  PAYMENT_FAILED: "❌",
  MEMBERSHIP_ASSIGNED: "📋",
  MEMBERSHIP_CANCELLED: "🚫",
  MEMBERSHIP_PAUSED: "⏸️",
  SCORE_SUBMITTED: "🏋️",
  PR_ACHIEVED: "⭐",
  BOOKING_CREATED: "📅",
  BOOKING_CANCELLED: "🗑️",
  BOOKING_CHECKIN: "✔️",
  CLASS_CANCELLED: "🔴",
};

const SEVERITY_STYLES: Record<FeedSeverity, string> = {
  info: "border-l-2 border-white/10",
  warning: "border-l-2 border-[var(--strain)]",
  sensitive: "border-l-2 border-[var(--pr)]",
};

function humanizeAction(action: AuditAction): string {
  const map: Partial<Record<AuditAction, string>> = {
    PAYMENT_REGISTERED: "registró un pago",
    PAYMENT_VOIDED: "anuló un pago",
    PAYMENT_INITIATED: "inició checkout",
    PAYMENT_CONFIRMED: "confirmó pago",
    PAYMENT_FAILED: "falló pago",
    MEMBERSHIP_ASSIGNED: "asignó membresía",
    MEMBERSHIP_CANCELLED: "canceló membresía",
    MEMBERSHIP_PAUSED: "pausó membresía",
    SCORE_SUBMITTED: "registró score",
    PR_ACHIEVED: "logró un PR",
    BOOKING_CREATED: "creó reserva",
    BOOKING_CANCELLED: "canceló reserva",
    BOOKING_CHECKIN: "hizo check-in",
    CLASS_CANCELLED: "canceló clase",
  };
  return map[action] ?? action;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function EventCard({ event }: { event: FeedEvent }) {
  const icon = ACTION_ICONS[event.action] ?? "📌";
  const severityStyle = SEVERITY_STYLES[event.severity];
  const amount = event.metadata?.amount as number | undefined;
  const currency = event.metadata?.currency as string | undefined;

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg bg-[var(--card)] ${severityStyle}`}
    >
      <div className="text-2xl flex-shrink-0 w-8 text-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {event.actor && (
            <span className="font-medium">{event.actor.name}</span>
          )}
          {event.actor && (
            <span className="k-chip k-chip-ghost text-xs">
              {event.actor.role}
            </span>
          )}
          {!event.actor && <span className="text-[var(--muted)]">Sistema</span>}
          <span className="text-[var(--muted)]">
            {humanizeAction(event.action)}
          </span>
          {event.target.link ? (
            <a
              href={event.target.link}
              className="text-[var(--strain)] hover:underline truncate"
            >
              {event.target.label}
            </a>
          ) : (
            <span className="text-[var(--muted)] truncate">
              {event.target.label}
            </span>
          )}
        </div>
        {amount !== undefined && (
          <p className="text-sm text-[var(--muted)] mt-1">
            Monto:{" "}
            <strong className="text-white">
              ${amount.toFixed(2)} {currency ?? ""}
            </strong>
          </p>
        )}
      </div>
      <div className="text-xs text-[var(--muted)] flex-shrink-0 text-right">
        <div>{formatDate(event.when)}</div>
        <div className="font-mono">{formatTime(event.when)}</div>
        {event.severity === "sensitive" && (
          <div className="mt-1 k-chip text-[var(--pr)] bg-[var(--pr)]/10 border-[var(--pr)]/20">
            sensible
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string; action?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const days = Number(params?.days ?? 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await getOwnerLiveFeed({
    since,
    limit: 100,
    action: params?.action as AuditAction | undefined,
  });

  const sensitiveCount = events.filter(
    (e) => e.severity === "sensitive",
  ).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <p className="k-eyebrow mb-2">Control</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-2">
        Feed de Auditoría
      </h1>
      <p className="text-[var(--muted)] mb-6">
        Trazabilidad en tiempo real de todas las acciones del equipo.
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-2 items-center">
          <label className="text-sm text-[var(--muted)]">Últimos</label>
          {[1, 3, 7, 30].map((d) => (
            <button
              key={d}
              name="days"
              value={d}
              type="submit"
              className={`k-chip transition-colors ${
                days === d
                  ? "k-chip-strain"
                  : "k-chip-ghost hover:k-chip-strain"
              }`}
            >
              {d === 1 ? "hoy" : `${d}d`}
            </button>
          ))}
        </form>

        {sensitiveCount > 0 && (
          <div className="ml-auto k-chip text-[var(--pr)] bg-[var(--pr)]/10 border-[var(--pr)]/20">
            {sensitiveCount} evento{sensitiveCount !== 1 ? "s" : ""} sensible
            {sensitiveCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="k-card p-12 text-center text-[var(--muted)]">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Sin eventos en este período</p>
          <p className="text-sm mt-1">
            Amplia el rango de fechas para ver más actividad.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
