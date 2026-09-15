import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileSearch } from "lucide-react";
import { authOptions } from "@/server/auth";
import { getOwnerLiveFeed, type FeedEvent } from "@/server/actions/owner-feed";
import AuditTimeline from "@/components/admin/AuditTimeline";
import AuditFilters from "@/components/admin/AuditFilters";
import { SearchInput } from "@/components/data/SearchInput";
import {
  AUDIT_CATEGORIES,
  dropFutureAuditEvents,
  humanizeAuditEvent,
  humanizeAuditTargetLabel,
  type AuditCategory,
} from "@/lib/audit-humanize";
import { readAuditSubject } from "@/components/admin/audit-subject";

export const metadata = { title: "Kronos — Auditoría" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const MAX_TAKE = 200;

function parseTake(v?: string): number {
  const n = parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return PAGE_SIZE;
  return Math.min(MAX_TAKE, Math.max(PAGE_SIZE, n));
}

function matchesSearch(event: FeedEvent, needle: string): boolean {
  const haystack = [
    event.actor?.name ?? "",
    event.label,
    event.target.label,
    event.action,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams?: Promise<{
    days?: string;
    action?: string;
    category?: string;
    q?: string;
    take?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const days = Number(params?.days ?? 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const take = parseTake(params?.take);
  const search = (params?.q ?? "").trim().toLowerCase();
  const categoryParam =
    params?.category &&
    AUDIT_CATEGORIES.includes(params.category as AuditCategory)
      ? (params.category as AuditCategory)
      : undefined;

  const raw = await getOwnerLiveFeed({
    since,
    // one extra row tells us whether "cargar más" has anything to load
    limit: take + 1,
    category: categoryParam,
  });

  const now = new Date();
  /*
   * An audit row cannot have happened after now. Seeded futures used to sort
   * above "HOY", which read as a broken clock (audit 2026-09-15).
   */
  const present = dropFutureAuditEvents(raw, now);
  const filtered = search
    ? present.filter((e) => matchesSearch(e, search))
    : present;

  // "more" means the feed has rows we did not fetch, whether or not the search
  // matched them — otherwise searching would hide the way to find its own hits.
  const hasMore = raw.length > take;
  const page = filtered.slice(0, take);

  /*
   * Rewrite each row so the timeline never renders a raw entity id or an
   * unformatted amount. The component owns the icons and the chip styling; the
   * data it receives is ours.
   */
  const events: FeedEvent[] = page.map((e) => {
    // `logAudit` stamps the athlete and plan names onto payment metadata at
    // write time, so the headline can name WHOSE payment it was:
    // "Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN".
    const subject = readAuditSubject(e.metadata);
    const humanized = humanizeAuditEvent({
      action: e.action,
      metadata: e.metadata,
      targetType: e.target.type,
      subject: {
        athleteName: subject.athleteName,
        planName: subject.planName,
      },
    });
    // Everything the composed label already says is dropped here, so the
    // timeline cannot print the same name and amount a second time.
    const restMetadata = Object.fromEntries(
      Object.entries(e.metadata).filter(
        ([key]) =>
          key !== "amount" &&
          key !== "currency" &&
          key !== "athleteName" &&
          key !== "planName",
      ),
    );
    return {
      ...e,
      label: humanized.detail ?? humanized.label,
      severity: humanized.severity,
      category: humanized.category,
      // money already lives inside the label, formatted once
      metadata: restMetadata,
      target: {
        ...e.target,
        label: humanizeAuditTargetLabel({
          targetType: e.target.type,
          label: e.target.label,
          actorName: e.actor?.name ?? null,
        }),
      },
    };
  });

  const sensitiveCount = events.filter(
    (e) => e.severity === "sensitive",
  ).length;

  const moreHref = ((): Route => {
    const qs = new URLSearchParams();
    if (params?.days) qs.set("days", params.days);
    if (params?.category) qs.set("category", params.category);
    if (params?.q) qs.set("q", params.q);
    qs.set("take", String(Math.min(MAX_TAKE, take + PAGE_SIZE)));
    return `/admin/auditoria?${qs.toString()}` as Route;
  })();

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <span className="k-eyebrow-bar">Control · Trazabilidad</span>
      <h1
        className="k-h-italic font-display mt-2 text-[30px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[38px]"
        style={{ color: "var(--k-t1)" }}
      >
        Audi<em>toría</em>
      </h1>
      <p className="mt-2 mb-6 text-sm" style={{ color: "var(--k-t2)" }}>
        Todo lo que hace tu equipo, en orden y con nombre y apellido.
      </p>

      <AuditFilters sensitiveCount={sensitiveCount} />

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por persona, acción o atleta…"
          ariaLabel="Buscar en la auditoría"
        />
      </div>

      {events.length === 0 ? (
        <div className="k-card p-12 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line-2)",
              color: "var(--k-t2)",
            }}
          >
            <FileSearch size={20} strokeWidth={1.8} aria-hidden />
          </div>
          <p className="text-text font-medium">
            {search ? "Sin coincidencias" : "Sin eventos en este período"}
          </p>
          <p className="text-text-3 mt-1 text-sm">
            {search
              ? "Prueba con otro nombre o amplía el rango de fechas."
              : "Todo tranquilo. Amplía el rango de fechas para ver más actividad."}
          </p>
        </div>
      ) : (
        <AuditTimeline events={events} />
      )}

      <div className="mt-6 flex flex-col items-center gap-2">
        {events.length > 0 ? (
          <p className="text-xs" style={{ color: "var(--k-t3)" }}>
            {events.length} evento{events.length === 1 ? "" : "s"}
          </p>
        ) : null}
        {hasMore && take < MAX_TAKE ? (
          <Link
            href={moreHref}
            scroll={false}
            className="k-btn-ghost inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Cargar más
          </Link>
        ) : null}
      </div>
    </div>
  );
}
