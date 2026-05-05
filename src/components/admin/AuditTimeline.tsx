"use client";

import { motion } from "framer-motion";
import { hashStringToColor, getInitials } from "@/lib/hash-color";
import type { FeedEvent, FeedSeverity } from "@/server/actions/owner-feed";
import type { AuditAction } from "@prisma/client";

const ACTION_ICONS: Partial<Record<AuditAction, string>> = {
  PAYMENT_REGISTERED: "💰",
  PAYMENT_CONFIRMED: "💰",
  PAYMENT_INITIATED: "🏦",
  PAYMENT_VOIDED: "↩️",
  PAYMENT_FAILED: "❌",
  MEMBERSHIP_ASSIGNED: "📋",
  MEMBERSHIP_CANCELLED: "🚫",
  MEMBERSHIP_PAUSED: "⏸️",
  SCORE_SUBMITTED: "🏋️",
  BULK_SCORES_FROM_WHITEBOARD: "🏋️",
  PR_ACHIEVED: "⭐",
  BOOKING_CREATED: "📅",
  BOOKING_CANCELLED: "🗑️",
  BOOKING_CHECKIN: "✔️",
  BOOKING_NOSHOW: "🚫",
  WAITLIST_PROMOTED: "📢",
  CLASS_CANCELLED: "🔴",
  WOD_ARCHIVED: "📦",
  PLAN_ARCHIVED: "📦",
  WEBHOOK_RECEIVED: "🌐",
  WHITEBOARD_UPLOADED: "📷",
};

const ACTION_VERBS: Partial<Record<AuditAction, string>> = {
  PAYMENT_REGISTERED: "registró un pago",
  PAYMENT_CONFIRMED: "confirmó pago",
  PAYMENT_INITIATED: "inició checkout",
  PAYMENT_VOIDED: "anuló un pago",
  PAYMENT_FAILED: "falló un pago",
  MEMBERSHIP_ASSIGNED: "asignó membresía",
  MEMBERSHIP_CANCELLED: "canceló membresía",
  MEMBERSHIP_PAUSED: "pausó membresía",
  SCORE_SUBMITTED: "registró score",
  BULK_SCORES_FROM_WHITEBOARD: "cargó scores desde pizarra",
  PR_ACHIEVED: "logró un PR",
  BOOKING_CREATED: "creó reserva",
  BOOKING_CANCELLED: "canceló reserva",
  BOOKING_CHECKIN: "hizo check-in",
  BOOKING_NOSHOW: "marcó no-show",
  WAITLIST_PROMOTED: "promovió de lista de espera",
  CLASS_CANCELLED: "canceló clase",
  WOD_ARCHIVED: "archivó WOD",
  PLAN_ARCHIVED: "archivó plan",
  WEBHOOK_RECEIVED: "recibió webhook",
  WHITEBOARD_UPLOADED: "subió foto de pizarra",
};

function severityColor(sev: FeedSeverity): string {
  switch (sev) {
    case "info":
      return "bg-white/20";
    case "warning":
      return "bg-[var(--amber)]";
    case "sensitive":
      return "bg-[var(--ember)]";
  }
}

function severityPulse(sev: FeedSeverity): string {
  switch (sev) {
    case "info":
      return "";
    case "warning":
      return "k-pulse-glow";
    case "sensitive":
      return "k-pulse-glow";
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return "Hoy";
  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupByDate(events: FeedEvent[]): [string, FeedEvent[]][] {
  const groups = new Map<string, FeedEvent[]>();
  for (const event of events) {
    const key = event.when.toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return Array.from(groups.entries());
}

export default function AuditTimeline({ events }: { events: FeedEvent[] }) {
  const grouped = groupByDate(events);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--line)]" />

      <div className="space-y-6">
        {grouped.map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            {/* Date header */}
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center z-10">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase">
                  {formatDate(dayEvents[0].when)}
                </span>
              </div>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {/* Events */}
            <div className="space-y-3">
              {dayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: idx * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  }}
                  className="relative flex gap-4"
                >
                  {/* Dot on timeline */}
                  <div className="relative z-10 flex flex-col items-center pt-3">
                    <div
                      className={`w-3 h-3 rounded-full ${severityColor(event.severity)} ${severityPulse(event.severity)} ring-2 ring-[var(--card)]`}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <div className="k-card-flat p-4 hover:bg-[var(--card-2)] transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {event.actor ? (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{
                              backgroundColor: hashStringToColor(
                                event.actor.id,
                              ),
                            }}
                            title={event.actor.name}
                          >
                            {getInitials(event.actor.name)}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-sm shrink-0">
                            🤖
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {event.actor && (
                              <span className="font-medium text-sm text-white">
                                {event.actor.name}
                              </span>
                            )}
                            {!event.actor && (
                              <span className="text-sm text-white/50">
                                Sistema
                              </span>
                            )}
                            <span className="text-white/40 text-sm">
                              {ACTION_VERBS[event.action] ?? event.action}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-lg">
                              {ACTION_ICONS[event.action] ?? "📌"}
                            </span>
                            {event.target.link ? (
                              <a
                                href={event.target.link}
                                className="text-[var(--steel)] hover:text-[var(--strain)] hover:underline text-sm truncate transition-colors"
                              >
                                {event.target.label}
                              </a>
                            ) : (
                              <span className="text-white/40 text-sm truncate">
                                {event.target.label}
                              </span>
                            )}
                            <span className="text-white/20 text-xs font-mono ml-auto">
                              {formatTime(event.when)}
                            </span>
                          </div>

                          {/* Metadata */}
                          {event.metadata?.amount !== undefined && (
                            <p className="text-xs text-white/40 mt-1.5">
                              Monto:{" "}
                              <strong className="text-white">
                                ${Number(event.metadata.amount).toFixed(2)}{" "}
                                {(event.metadata.currency as string) ?? ""}
                              </strong>
                            </p>
                          )}

                          {event.severity === "sensitive" && (
                            <div className="mt-2 inline-flex">
                              <span className="k-chip text-[var(--ember)] bg-[var(--ember-soft)] border-[var(--ember-line)] text-[10px]">
                                <span className="relative flex h-1.5 w-1.5 mr-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ember)] opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--ember)]" />
                                </span>
                                Sensible
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
