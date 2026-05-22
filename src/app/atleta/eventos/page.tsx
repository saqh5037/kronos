import Link from "next/link";
import type { Route } from "next";
import {
  listMyEventEntries,
  listOpenEvents,
  type SportEventDTO,
  type MyEventEntryRow,
} from "@/server/actions/events";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";

export const metadata = { title: "Kronos — Eventos" };
export const dynamic = "force-dynamic";

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function EventCard({
  event,
  entry,
}: {
  event: SportEventDTO;
  entry?: MyEventEntryRow | null;
}) {
  const date = formatDate(event.startDate);
  const isRegistered = !!entry;
  const hasResult = !!entry?.submittedAt;

  return (
    <Link
      href={`/atleta/eventos/${event.slug}` as Route}
      className="k-card p-5 block transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {event.partnerName ? (
            <p className="k-eyebrow mb-1" style={{ color: "var(--k-accent)" }}>
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
        {hasResult ? (
          <span className="k-chip k-chip-pr">Enviado</span>
        ) : isRegistered ? (
          <span className="k-chip">Inscrito</span>
        ) : null}
      </div>

      {date ? (
        <p className="text-xs" style={{ color: "var(--k-t2)" }}>
          {date}
        </p>
      ) : null}

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

export default async function EventosListPage() {
  const [myEntries, openEvents] = await Promise.all([
    listMyEventEntries().catch(() => []),
    listOpenEvents().catch(() => []),
  ]);

  const myEventIds = new Set(myEntries.map((r) => r.eventId));
  const available = openEvents.filter((e) => !myEventIds.has(e.id));

  return (
    <>
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>

      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="k-eyebrow" style={{ color: "var(--k-accent)" }}>
            Eventos deportivos
          </p>
          <h1
            className="font-display text-3xl mt-1"
            style={{ color: "var(--k-t1)" }}
          >
            Tus competencias
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: "var(--k-t2)" }}
          >
            Escanea el código QR que reparte el organizador del evento para
            inscribirte. Aquí van a aparecer todas tus participaciones y
            resultados.
          </p>
        </header>

        {myEntries.length === 0 && available.length === 0 ? (
          <div className="k-card p-8 text-center">
            <h2 className="font-display text-lg mb-2">Aún no hay eventos</h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--k-t2)" }}
            >
              Cuando un organizador (Dominus, tu box, una competencia) abra una
              convocatoria, vas a poder inscribirte escaneando su código QR
              desde aquí.
            </p>
          </div>
        ) : null}

        {myEntries.length > 0 ? (
          <section className="mb-8">
            <h2 className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              Mis inscripciones
            </h2>
            <div className="space-y-3">
              {myEntries.map((row) => (
                <EventCard key={row.id} event={row.event} entry={row} />
              ))}
            </div>
          </section>
        ) : null}

        {available.length > 0 ? (
          <section>
            <h2 className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              Eventos abiertos
            </h2>
            <p className="text-xs mb-3" style={{ color: "var(--k-t3)" }}>
              Para inscribirte necesitas el código QR del organizador.
            </p>
            <div className="space-y-3">
              {available.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
