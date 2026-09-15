/**
 * Athlete events list.
 *
 * Audit 2026-09-15: "'EVENTOS ABIERTOS' lists 'Dominus Murph 2026 · 23 may
 * 2026', a past event the detail page calls FINALIZADO." Past events now live
 * under "Concluidos", upcoming ones carry a countdown, and every status chip
 * goes through `eventStatusLabel` instead of printing the enum.
 */

import Link from "next/link";
import type { Route } from "next";
import type { EventStatus } from "@prisma/client";
import {
  listMyEventEntries,
  listOpenEvents,
  type SportEventDTO,
  type MyEventEntryRow,
} from "@/server/actions/events";
import { eventStatusLabel } from "@/lib/labels";
import { formatDateLong } from "@/lib/format";
import { countdownLabel, isPastDay } from "../_lib/countdown";
import EventCodeEntry from "./EventCodeEntry";

function statusLabelOf(event: SportEventDTO, past: boolean): string {
  if (past) return "Concluido";
  return eventStatusLabel[event.status as EventStatus] ?? "Abierto";
}

function EventCard({
  event,
  entry,
  now,
}: {
  event: SportEventDTO;
  entry?: MyEventEntryRow | null;
  now: Date;
}) {
  const past = isPastDay(event.startDate, now);
  const isRegistered = !!entry;
  const hasResult = !!entry?.submittedAt;

  return (
    <Link
      href={`/atleta/eventos/${event.slug}` as Route}
      className="k-card p-5 block"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div style={{ minWidth: 0 }}>
          {event.partnerName ? (
            <p className="k-eyebrow mb-1" style={{ color: "var(--k-t3)" }}>
              {event.partnerName}
            </p>
          ) : null}
          <h3
            className="font-display text-lg leading-tight"
            style={{ color: "var(--k-t1)" }}
          >
            {event.name}
          </h3>
        </div>
        <span
          className="k-mono"
          style={{
            flexShrink: 0,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "3px 9px",
            borderRadius: 999,
            border: `1px solid ${hasResult ? "var(--k-accent-line)" : "var(--k-line-2)"}`,
            background: hasResult ? "var(--k-accent-soft)" : "transparent",
            color: hasResult ? "var(--k-accent)" : "var(--k-t3)",
          }}
        >
          {hasResult
            ? "Resultado enviado"
            : isRegistered
              ? "Inscrito"
              : statusLabelOf(event, past)}
        </span>
      </div>

      <p className="text-xs" style={{ color: "var(--k-t2)" }}>
        {formatDateLong(event.startDate)}
        {!past ? ` · ${countdownLabel(event.startDate, now)}` : ""}
      </p>

      {entry?.scoreText ? (
        <div
          className="mt-3 pt-3 border-t flex items-center justify-between text-sm"
          style={{ borderColor: "var(--k-line)" }}
        >
          <span style={{ color: "var(--k-t2)" }}>Tu resultado</span>
          <span className="font-display" style={{ color: "var(--k-accent)" }}>
            {entry.scoreText}
            {entry.division ? ` · ${entry.division}` : ""}
          </span>
        </div>
      ) : null}
    </Link>
  );
}

export async function EventosContent() {
  const [myEntries, openEvents] = await Promise.all([
    listMyEventEntries().catch(() => []),
    listOpenEvents().catch(() => []),
  ]);

  // Compared server-side so the section an event lands in never depends on the
  // client clock.
  const now = new Date();

  const myEventIds = new Set(myEntries.map((r) => r.eventId));
  const available = openEvents.filter((e) => !myEventIds.has(e.id));

  const upcomingMine = myEntries.filter(
    (r) => !isPastDay(r.event.startDate, now),
  );
  const pastMine = myEntries.filter((r) => isPastDay(r.event.startDate, now));
  const upcomingOpen = available.filter((e) => !isPastDay(e.startDate, now));
  const pastOpen = available.filter((e) => isPastDay(e.startDate, now));

  const hasNothing = myEntries.length === 0 && available.length === 0;

  return (
    <>
      <div className="mb-6">
        <EventCodeEntry />
      </div>

      {hasNothing ? (
        <div className="k-card p-8 text-center">
          <h2 className="font-display text-lg mb-2">Aún no hay eventos</h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--k-t2)" }}
          >
            Cuando un organizador (Dominus, tu box, una competencia) abra una
            convocatoria, podrás inscribirte con su código desde aquí.
          </p>
        </div>
      ) : null}

      {upcomingMine.length > 0 ? (
        <Section title="Mis inscripciones">
          {upcomingMine.map((row) => (
            <EventCard key={row.id} event={row.event} entry={row} now={now} />
          ))}
        </Section>
      ) : null}

      {upcomingOpen.length > 0 ? (
        <Section title="Eventos abiertos">
          {upcomingOpen.map((event) => (
            <EventCard key={event.id} event={event} now={now} />
          ))}
        </Section>
      ) : null}

      {pastMine.length > 0 || pastOpen.length > 0 ? (
        <Section title="Concluidos">
          {pastMine.map((row) => (
            <EventCard key={row.id} event={row.event} entry={row} now={now} />
          ))}
          {pastOpen.map((event) => (
            <EventCard key={event.id} event={event} now={now} />
          ))}
        </Section>
      ) : null}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function EventosContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="k-card k-skeleton"
          style={{ height: 100, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}
