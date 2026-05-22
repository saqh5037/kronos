import { notFound } from "next/navigation";
import { getEventBySlugForAthlete } from "@/server/actions/events";
import { formatSecondsToTime } from "@/lib/event-score";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import EventResultForm from "./_components/EventResultForm";

export const metadata = { title: "Kronos — Evento" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function EventoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getEventBySlugForAthlete(slug);

  if (!data) notFound();
  const { event, entry } = data;

  // Si el atleta no está inscrito todavía, mostramos info + cómo inscribirse.
  if (!entry) {
    return (
      <>
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta/eventos" label="Eventos" />
        </div>
        <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
          <header className="mb-4">
            {event.partnerName ? (
              <p
                className="k-eyebrow mb-1"
                style={{ color: "var(--k-accent)" }}
              >
                {event.partnerName}
              </p>
            ) : null}
            <h1
              className="font-display text-3xl mt-1"
              style={{ color: "var(--k-t1)" }}
            >
              {event.name}
            </h1>
            {event.startDate ? (
              <p className="text-sm mt-2" style={{ color: "var(--k-t2)" }}>
                {formatDate(event.startDate)}
              </p>
            ) : null}
          </header>

          <div className="k-card p-5">
            <h2 className="font-display text-lg mb-2">Aún no estás inscrito</h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--k-t2)" }}
            >
              Para registrar tu resultado primero tienes que inscribirte
              escaneando el código QR que reparte el organizador. Pídelo a tu
              coach o al equipo de {event.partnerName ?? "la competencia"}.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta/eventos" label="Eventos" />
      </div>
      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
        <header className="mb-5">
          {event.partnerName ? (
            <p className="k-eyebrow mb-1" style={{ color: "var(--k-accent)" }}>
              {event.partnerName}
            </p>
          ) : null}
          <h1
            className="font-display text-3xl mt-1"
            style={{ color: "var(--k-t1)" }}
          >
            {event.name}
          </h1>
          {event.startDate ? (
            <p className="text-sm mt-2" style={{ color: "var(--k-t2)" }}>
              {formatDate(event.startDate)}
            </p>
          ) : null}
        </header>

        {event.description ? (
          <div
            className="k-card p-5 mb-5 text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "var(--k-t2)" }}
          >
            {event.description}
          </div>
        ) : null}

        {entry.submittedAt ? (
          <div className="k-card p-5 mb-5">
            <p className="k-eyebrow mb-2" style={{ color: "var(--k-accent)" }}>
              Tu resultado registrado
            </p>
            <div className="flex items-baseline gap-3">
              <span
                className="font-display text-3xl"
                style={{ color: "var(--k-t1)" }}
              >
                {entry.scoreText}
              </span>
              {entry.division ? (
                <span className="k-chip">{entry.division}</span>
              ) : null}
            </div>
            {entry.notes ? (
              <p className="text-sm mt-3" style={{ color: "var(--k-t2)" }}>
                {entry.notes}
              </p>
            ) : null}
            {entry.mediaUrl ? (
              <div className="mt-4">
                <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
                  Captura
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.mediaUrl}
                  alt="Captura del resultado"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid var(--k-line)",
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="k-card p-5 mb-5">
          <h2 className="font-display text-lg mb-1">
            {entry.submittedAt ? "Actualizar resultado" : "Registrar resultado"}
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--k-t2)" }}>
            Anota tu tiempo final, elige la división y opcionalmente sube una
            foto del whiteboard o cronómetro.
          </p>
          <EventResultForm
            entryId={entry.id}
            divisions={event.divisions}
            eventSlug={event.slug}
            initialDivision={entry.division}
            initialScoreSeconds={
              entry.scoreValue === null ? null : Math.round(entry.scoreValue)
            }
            initialScoreText={
              entry.scoreText ??
              (entry.scoreValue === null
                ? ""
                : formatSecondsToTime(Math.round(entry.scoreValue)))
            }
            initialNotes={entry.notes}
            alreadySubmitted={!!entry.submittedAt}
          />
        </div>

        {event.kitUrl ? (
          <a
            href={event.kitUrl}
            target="_blank"
            rel="noreferrer"
            className="k-card p-4 block text-sm"
            style={{ color: "var(--k-t1)" }}
          >
            Descargar kit digital del evento ↗
          </a>
        ) : (
          <div className="k-card p-4 text-sm" style={{ color: "var(--k-t3)" }}>
            Kit digital · próximamente — sincronizando con{" "}
            {event.partnerName ?? "el organizador"}.
          </div>
        )}
      </main>
    </>
  );
}
