"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { hashStringToColor, getInitials } from "@/lib/hash-color";
import { Icon, type IconName } from "@/components/kronos/Icon";
import type { FeedEvent, FeedSeverity } from "@/server/actions/owner-feed";
import type { AuditAction } from "@prisma/client";

const ACTION_ICONS: Partial<Record<AuditAction, IconName>> = {
  PAYMENT_REGISTERED: "cash",
  PAYMENT_CONFIRMED: "checkCircle",
  PAYMENT_INITIATED: "bank",
  PAYMENT_VOIDED: "refund",
  PAYMENT_FAILED: "failed",
  MEMBERSHIP_ASSIGNED: "clipboard",
  MEMBERSHIP_CANCELLED: "blocked",
  MEMBERSHIP_PAUSED: "clock",
  SCORE_SUBMITTED: "wod",
  BULK_SCORES_FROM_WHITEBOARD: "wod",
  PR_ACHIEVED: "trophy",
  BOOKING_CREATED: "calendar",
  BOOKING_CANCELLED: "trash",
  BOOKING_CHECKIN: "check",
  BOOKING_NOSHOW: "blocked",
  WAITLIST_PROMOTED: "megaphone",
  CLASS_CANCELLED: "failed",
  WOD_ARCHIVED: "archive",
  PLAN_ARCHIVED: "archive",
  WEBHOOK_RECEIVED: "globe",
  WHITEBOARD_UPLOADED: "camera",
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

/**
 * Timeline dots are a category marker, not an alarm: ordinary events sit in
 * neutral grey and anything the owner should notice steps up to lime. Warning
 * orange is reserved for a real warning (audit 2026-09-15, S2).
 */
function severityColor(sev: FeedSeverity): string {
  switch (sev) {
    case "info":
      return "bg-[var(--k-t3)]";
    case "warning":
      return "bg-[var(--k-accent)]";
    case "sensitive":
      return "bg-[var(--k-accent)]";
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date, now: Date | null): string {
  if (now && date.toDateString() === now.toDateString()) return "Hoy";
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
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--k-line)]" />

      <div className="space-y-6">
        {grouped.map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            {/* Date header */}
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--k-elevated)] border border-[var(--k-line)] flex items-center justify-center z-10">
                <span className="text-[10px] font-mono font-bold text-[var(--k-t2)] uppercase">
                  {formatDate(dayEvents[0].when, now)}
                </span>
              </div>
              <div className="h-px flex-1 bg-[var(--k-line)]" />
            </div>

            {/* Events */}
            <div className="space-y-3">
              {dayEvents.map((event, idx) => (
                <m.div
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
                      className={`w-3 h-3 rounded-full ${severityColor(event.severity)} ring-2 ring-[var(--k-surface)]`}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <div className="k-card-flat p-4 hover:bg-[var(--k-elevated)] transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {event.actor ? (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[var(--k-t1)] shrink-0"
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
                          <div className="w-9 h-9 rounded-full bg-[var(--k-elevated)] border border-[var(--k-line)] flex items-center justify-center shrink-0">
                            <Icon
                              name="bot"
                              size={16}
                              label="Sistema"
                              style={{ color: "var(--k-t2)" }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {event.actor && (
                              <span className="font-medium text-sm text-[var(--k-t1)]">
                                {event.actor.name}
                              </span>
                            )}
                            {!event.actor && (
                              <span className="text-sm text-[var(--k-t2)]">
                                Sistema
                              </span>
                            )}
                            <span className="text-[var(--k-t2)] text-sm">
                              {event.label ??
                                ACTION_VERBS[event.action] ??
                                event.action}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Icon
                              name={ACTION_ICONS[event.action] ?? "pin"}
                              size={16}
                              style={{ color: "var(--k-t2)" }}
                            />
                            {event.target.link ? (
                              <a
                                href={event.target.link}
                                className="text-[var(--k-t2)] hover:text-[var(--k-accent)] hover:underline text-sm truncate transition-colors"
                              >
                                {event.target.label}
                              </a>
                            ) : (
                              <span className="text-[var(--k-t2)] text-sm truncate">
                                {event.target.label}
                              </span>
                            )}
                            <span className="text-[var(--k-t2)] text-xs font-mono ml-auto">
                              {formatTime(event.when)}
                            </span>
                          </div>

                          {/* Metadata */}
                          {event.metadata?.amount !== undefined && (
                            <p className="text-xs text-[var(--k-t2)] mt-1.5">
                              Monto:{" "}
                              <strong className="text-[var(--k-t1)]">
                                ${Number(event.metadata.amount).toFixed(2)}{" "}
                                {(event.metadata.currency as string) ?? ""}
                              </strong>
                            </p>
                          )}

                          {event.severity === "sensitive" && (
                            <div className="mt-2 inline-flex">
                              <span className="k-chip text-[var(--k-warning)] bg-[var(--k-elevated)] border-[var(--k-line-2)] text-[10px]">
                                <Icon name="alert" size={16} />
                                Sensible
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
