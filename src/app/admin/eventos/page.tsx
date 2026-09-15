import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import {
  listBoxEntriesForEvent,
  listOpenEvents,
  type BoxEntryRow,
} from "@/server/actions/events";
import { formatDateLong, formatDateShort, formatTime24 } from "@/lib/format";

export const metadata = { title: "Kronos · Admin — Eventos" };
export const dynamic = "force-dynamic";

function formatSubmitted(d: Date | null | undefined) {
  if (!d) return "—";
  return `${formatDateShort(d)} ${formatTime24(d)}`;
}

function hasFinished(
  event: { startDate: Date; endDate: Date | null },
  now: Date,
) {
  const closesAt = event.endDate ?? event.startDate;
  return closesAt.getTime() < now.getTime();
}

function EntriesTable({
  rows,
  finished,
}: {
  rows: BoxEntryRow[];
  finished: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-sm" style={{ color: "var(--k-t3)" }}>
        {finished
          ? "Ningún atleta de tu box participó en este evento."
          : "Todavía no hay atletas de tu box inscritos en este evento."}
      </p>
    );
  }
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: "var(--k-t3)" }}>
            <th className="px-2 py-2 text-left font-medium">Atleta</th>
            <th className="px-2 py-2 text-left font-medium">División</th>
            <th className="px-2 py-2 text-left font-medium">Resultado</th>
            <th className="px-2 py-2 text-left font-medium">Enviado</th>
            <th className="px-2 py-2 text-left font-medium">Captura</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderTop: "1px solid var(--k-line)" }}>
              <td className="px-2 py-2" style={{ color: "var(--k-t1)" }}>
                {row.athleteName}
              </td>
              <td className="px-2 py-2" style={{ color: "var(--k-t2)" }}>
                {row.division ?? "—"}
              </td>
              <td
                className="font-display px-2 py-2"
                style={{ color: "var(--k-accent)" }}
              >
                {row.scoreText ?? "—"}
              </td>
              <td className="px-2 py-2" style={{ color: "var(--k-t2)" }}>
                {formatSubmitted(row.submittedAt)}
              </td>
              <td className="px-2 py-2">
                {row.mediaUrl ? (
                  <a
                    href={row.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--k-accent)" }}
                  >
                    Ver
                  </a>
                ) : (
                  <span style={{ color: "var(--k-t3)" }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminEventosPage() {
  const now = new Date();
  const events = await listOpenEvents().catch(() => []);

  const entriesByEvent = await Promise.all(
    events.map((e) =>
      listBoxEntriesForEvent(e.slug)
        .then((r) => ({ slug: e.slug, rows: r.rows }))
        .catch(() => ({ slug: e.slug, rows: [] as BoxEntryRow[] })),
    ),
  );
  const entryMap = new Map<string, BoxEntryRow[]>(
    entriesByEvent.map((r) => [r.slug, r.rows]),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <header className="mb-6">
        <span className="k-eyebrow-bar">Competencia · Eventos</span>
        <h1
          className="k-h-italic font-display mt-2 text-[30px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[38px]"
          style={{ color: "var(--k-t1)" }}
        >
          Eventos y <em>resultados</em>
        </h1>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--k-t2)" }}
        >
          Competencias abiertas a varios boxes, organizadas por Kronos y sus
          aliados. Aquí ves los resultados de los atletas de tu box que se
          inscribieron con el código QR.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="k-card p-8 text-center">
          <h2 className="font-display mb-2 text-lg">No hay eventos abiertos</h2>
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Cuando se publique un evento nuevo aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const rows = entryMap.get(event.slug) ?? [];
            const submitted = rows.filter((r) => r.submittedAt).length;
            const finished = hasFinished(event, now);
            return (
              <section key={event.id} className="k-card p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {event.partnerName ? (
                      <p
                        className="k-eyebrow mb-1"
                        style={{ color: "var(--k-accent)" }}
                      >
                        {event.partnerName}
                      </p>
                    ) : null}
                    <h2
                      className="font-display text-xl"
                      style={{ color: "var(--k-t1)" }}
                    >
                      {event.name}
                    </h2>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--k-t2)" }}
                    >
                      {formatDateLong(event.startDate)}
                      {finished ? (
                        <span
                          className="k-chip k-chip-ghost ml-2 text-[10px]"
                          style={{ color: "var(--k-t2)" }}
                        >
                          Concluido · {rows.length} inscrito
                          {rows.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div
                    className="text-right text-xs"
                    style={{ color: "var(--k-t2)" }}
                  >
                    <div>
                      <strong style={{ color: "var(--k-t1)" }}>
                        {rows.length}
                      </strong>{" "}
                      inscritos
                    </div>
                    <div>
                      <strong style={{ color: "var(--k-accent)" }}>
                        {submitted}
                      </strong>{" "}
                      con resultado
                    </div>
                  </div>
                </div>
                <Link
                  href={`/atleta/eventos/${event.slug}` as Route}
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: "var(--k-accent)" }}
                >
                  Ver como lo ve el atleta
                  <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden />
                </Link>
                <div className="mt-4">
                  <EntriesTable rows={rows} finished={finished} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
