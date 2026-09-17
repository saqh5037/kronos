"use client";

import { useEffect, useState } from "react";
import { getInitials } from "@/lib/hash-color";
import { groupAuditEventsByDay } from "@/lib/audit-humanize";
import { formatDateWeekday, formatTime24 } from "@/lib/format";
import { Icon, type IconName } from "@/components/kronos/Icon";
import type { FeedEvent, FeedSeverity } from "@/server/actions/owner-feed";
import type { AuditAction } from "@prisma/client";
import { auditDetailLine } from "./audit-subject";

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

export default function AuditTimeline({ events }: { events: FeedEvent[] }) {
  // "Hoy" and "Ayer" are functions of the clock, so the clock is read after
  // mount (hydration rule). Until then the reference is the newest event,
  // which makes the first render deterministic on both sides and labels every
  // group with its weekday — never a "Hoy" the server had no way to know.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const newest = events.reduce<Date | null>(
    (latest, e) => (!latest || e.when > latest ? e.when : latest),
    null,
  );
  const reference = now ?? newest ?? new Date(0);

  // The ONE day grouper: timezone-aware keys, newest day first, newest event
  // first inside each day, and future rows dropped. The local copy this
  // replaced bucketed by `toDateString()` in the browser's timezone and kept
  // seeded future rows, so "Hoy" could lead with next month.
  const grouped = groupAuditEventsByDay(events, reference);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--k-line)]" />

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.key}>
            {/* Date header */}
            <div className="relative mb-3 flex items-center gap-3">
              <div className="z-10 flex min-w-10 items-center justify-center rounded-full border border-[var(--k-line)] bg-[var(--k-elevated)] px-2.5 py-2">
                <span className="font-mono text-[10px] font-bold text-[var(--k-t2)] uppercase">
                  {now ? group.label : formatDateWeekday(group.date)}
                </span>
              </div>
              <div className="h-px flex-1 bg-[var(--k-line)]" />
            </div>

            {/*
              No entrance stagger. A 50 ms-per-row cascade over a list this
              long reads as an empty page that fills in, and the owner opens
              this screen to check a fact, not to watch it arrive.
            */}
            <div className="space-y-3">
              {group.events.map((event) => {
                const headline =
                  event.label ?? ACTION_VERBS[event.action] ?? event.action;
                const detail = auditDetailLine(headline, event.metadata);
                return (
                  <div key={event.id} className="relative flex gap-4">
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
                            /*
                            One surface, lime initials. `hashStringToColor`
                            gave every actor a different off-palette hue, which
                            put a dozen arbitrary colours on a screen whose
                            whole system is one accent (audit 2026-09-15, S2).
                            Identity is carried by the initials and the name.
                          */
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--k-line)] bg-[var(--k-elevated)] text-xs font-bold"
                              style={{ color: "var(--k-accent)" }}
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
                              <span className="text-sm text-[var(--k-t2)]">
                                {headline}
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
                              <span className="ml-auto font-mono text-xs text-[var(--k-t2)]">
                                {formatTime24(event.when)}
                              </span>
                            </div>

                            {/*
                            "Cobro en efectivo · Mía Moreno · Mensual
                            Ilimitado · $2,500 MXN" — the shared composer, so
                            the row answers WHOSE payment it was and prints the
                            amount in the one money format. This used to be a
                            bare `toFixed(2)` with no name at all.
                          */}
                            {detail ? (
                              <p className="mt-1.5 text-xs text-[var(--k-t2)]">
                                {detail}
                              </p>
                            ) : null}

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
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
