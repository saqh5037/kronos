import {
  listAnnouncements,
  type AnnouncementRow,
} from "@/server/actions/announcements";
import AnnouncementForm from "@/components/AnnouncementForm";
import {
  SendButton,
  DeleteAnnouncementButton,
} from "@/components/SendAnnouncementButton";
import { formatDayMonth, formatTime } from "@/lib/week";

export const metadata = { title: "Kronos — Comunicaciones" };

export default async function ComunicacionesPage() {
  let announcements: AnnouncementRow[] = [];
  try {
    announcements = await listAnnouncements();
  } catch {
    // BD/sesión ausente
  }

  const drafts = announcements.filter(
    (a) => a.status === "DRAFT" || a.status === "SCHEDULED",
  );
  const sent = announcements.filter(
    (a) => a.status === "SENT" || a.status === "FAILED",
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="k-eyebrow mb-1">Engagement</p>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Comunicaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Anuncios al box · email/in-app/push (proveedor mockeado en Fase 1)
          </p>
        </div>
        <AnnouncementForm />
      </div>

      {drafts.length > 0 && (
        <section className="mb-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--strain)" }}>
            Borradores y programados ({drafts.length})
          </p>
          <div className="flex flex-col gap-2">
            {drafts.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
          Historial ({sent.length})
        </p>
        {sent.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Sin anuncios enviados todavía.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sent.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ a }: { a: AnnouncementRow }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-base">{a.title}</h3>
          <div
            className="flex items-center gap-2 mt-1 text-[10px] flex-wrap"
            style={{ color: "var(--text-3)" }}
          >
            <span className="k-chip k-chip-ghost text-[10px]">{a.channel}</span>
            <span className="k-chip k-chip-strain text-[10px]">
              {a.audience}
            </span>
            <span className={`k-chip ${chipForStatus(a.status)} text-[10px]`}>
              {a.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(a.status === "DRAFT" || a.status === "SCHEDULED") && (
            <SendButton id={a.id} />
          )}
          <DeleteAnnouncementButton id={a.id} />
        </div>
      </div>
      <p
        className="text-sm whitespace-pre-line"
        style={{ color: "var(--text-2)" }}
      >
        {a.body}
      </p>
      <div
        className="flex items-center gap-3 mt-3 pt-3 border-t text-[10px]"
        style={{ borderColor: "var(--line)", color: "var(--text-3)" }}
      >
        <span>
          {a.authorName ?? "—"} · {formatDayMonth(a.createdAt)}{" "}
          {formatTime(a.createdAt)}
        </span>
        {a.sentAt && (
          <>
            <span>·</span>
            <span>
              Enviado a {a.recipientCount} · {formatDayMonth(a.sentAt)}
            </span>
          </>
        )}
        {a.scheduledAt && a.status === "SCHEDULED" && (
          <>
            <span>·</span>
            <span style={{ color: "var(--strain)" }}>
              Programado para {formatDayMonth(a.scheduledAt)}{" "}
              {formatTime(a.scheduledAt)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function chipForStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "k-chip-ghost";
    case "SCHEDULED":
    case "SENDING":
      return "k-chip-strain";
    case "SENT":
      return "k-chip-recovery";
    case "FAILED":
      return "k-chip-pr";
    default:
      return "k-chip-ghost";
  }
}
