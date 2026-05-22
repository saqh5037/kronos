import Link from "next/link";
import type { Route } from "next";
import {
  listBoxEntriesForEvent,
  listOpenEvents,
  type BoxEntryRow,
} from "@/server/actions/events";

export const metadata = { title: "Kronos · Admin — Eventos" };
export const dynamic = "force-dynamic";

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatSubmitted(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function EntriesTable({ rows }: { rows: BoxEntryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm py-4" style={{ color: "var(--k-t3)" }}>
        Ningún atleta de tu box se ha inscrito a este evento todavía.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: "var(--k-t3)" }}>
            <th className="text-left px-2 py-2 font-medium">Atleta</th>
            <th className="text-left px-2 py-2 font-medium">División</th>
            <th className="text-left px-2 py-2 font-medium">Resultado</th>
            <th className="text-left px-2 py-2 font-medium">Enviado</th>
            <th className="text-left px-2 py-2 font-medium">Captura</th>
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
                className="px-2 py-2 font-display"
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
    <main className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <p className="k-eyebrow" style={{ color: "var(--k-accent)" }}>
          Eventos deportivos
        </p>
        <h1
          className="font-display text-3xl mt-1"
          style={{ color: "var(--k-t1)" }}
        >
          Eventos y resultados
        </h1>
        <p
          className="text-sm mt-2 leading-relaxed"
          style={{ color: "var(--k-t2)" }}
        >
          Vista de eventos cross-box administrados por Kronos y sus partners
          (Dominus, etc.). Aquí ves los resultados de los atletas de tu box
          inscritos vía código QR.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="k-card p-8 text-center">
          <h2 className="font-display text-lg mb-2">No hay eventos abiertos</h2>
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Cuando se publique un evento nuevo, va a aparecer aquí
            automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const rows = entryMap.get(event.slug) ?? [];
            const submitted = rows.filter((r) => r.submittedAt).length;
            return (
              <section key={event.id} className="k-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
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
                    {event.startDate ? (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--k-t2)" }}
                      >
                        {formatDate(event.startDate)}
                      </p>
                    ) : null}
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
                  className="text-xs"
                  style={{ color: "var(--k-accent)" }}
                >
                  Ver vista del atleta ↗
                </Link>
                <div className="mt-4">
                  <EntriesTable rows={rows} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
