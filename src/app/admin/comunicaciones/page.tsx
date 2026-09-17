import {
  listAnnouncements,
  type AnnouncementRow,
} from "@/server/actions/announcements";
import AnnouncementForm from "@/components/AnnouncementForm";
import {
  SendButton,
  DeleteAnnouncementButton,
} from "@/components/SendAnnouncementButton";
import {
  announcementAudienceLabel,
  announcementChannelLabel,
  label,
} from "@/lib/labels";
import { formatDateShort, formatTime24 } from "@/lib/format";

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
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="k-eyebrow-bar">Engagement</span>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <h1
              className="k-h-italic font-display text-[34px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[40px]"
              style={{ color: "var(--k-t1)" }}
            >
              Comunica<em>ciones</em>
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            Avisos a todo el box, por correo o dentro de la app.
          </p>
        </div>
        <AnnouncementForm />
      </div>

      {drafts.length > 0 && (
        <section className="mb-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
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
        <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
          Historial ({sent.length})
        </p>
        {sent.length === 0 ? (
          <div className="k-card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              Todavía no has enviado ningún aviso.
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
    <div className="k-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold">{a.title}</h3>
          <div
            className="mt-1 flex flex-wrap items-center gap-2 text-[10px]"
            style={{ color: "var(--k-t3)" }}
          >
            <span className="k-chip k-chip-ghost text-[10px]">
              {announcementChannelLabel[a.channel]}
            </span>
            <span className="k-chip k-chip-steel text-[10px]">
              {announcementAudienceLabel[a.audience]}
            </span>
            <span className={`k-chip ${chipForStatus(a.status)} text-[10px]`}>
              {label("announcementStatus", a.status)}
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
        style={{ color: "var(--k-t2)" }}
      >
        {a.body}
      </p>
      <div
        className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-[10px]"
        style={{ borderColor: "var(--k-line)", color: "var(--k-t3)" }}
      >
        <span>
          {a.authorName ?? "—"} · {formatDateShort(a.createdAt)}{" "}
          {formatTime24(a.createdAt)}
        </span>
        {a.sentAt && (
          <>
            <span>·</span>
            <span>
              Enviado a {a.recipientCount} · {formatDateShort(a.sentAt)}
            </span>
          </>
        )}
        {a.scheduledAt && a.status === "SCHEDULED" && (
          <>
            <span>·</span>
            <span style={{ color: "var(--k-t2)" }}>
              Programado para {formatDateShort(a.scheduledAt)}{" "}
              {formatTime24(a.scheduledAt)}
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
      return "k-chip-steel";
    case "SENT":
      return "k-chip-moss";
    case "FAILED":
      return "k-chip-ember";
    default:
      return "k-chip-ghost";
  }
}
