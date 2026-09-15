"use client";

/**
 * LogrosCatalogCached — client-side badge grid backed by TanStack Query so the
 * catalog is persisted to IndexedDB and refreshed in background on window
 * focus / reconnect.
 *
 * Rendered by LogrosContent (server component) which provides initialData so
 * the first paint is instant (SSR hydration). The presentation lives here
 * because functions (render props) cannot cross the server/client boundary.
 *
 * Audit 2026-09-15: unlocked badges used to be gray two-letter codes with the
 * same treatment as locked ones ("a trophy room where trophies and empty
 * shelves look the same"). Unlocked is now a lime glyph tile, locked is an
 * outline in `--k-t3`, and every locked card shows its real computed progress.
 */

import Link from "next/link";
import type { Route } from "next";
import { useBadgeCatalog } from "@/lib/query/useBadgeCatalog";
import type { BadgeDetail } from "@/server/actions/badges";
import { BadgeGlyph } from "@/app/atleta/logros/_components/BadgeGlyph";

interface Props {
  tenantId: string;
  userId: string;
  initialData: BadgeDetail[];
}

export default function LogrosCatalogCached({
  tenantId,
  userId,
  initialData,
}: Props) {
  const { data } = useBadgeCatalog({ tenantId, userId, initialData });
  const badges = data ?? initialData;

  const unlocked = badges
    .filter((b) => b.unlocked)
    .sort((a, b) => toTime(b.earnedAt) - toTime(a.earnedAt));
  const locked = badges
    .filter((b) => !b.unlocked)
    .sort((a, b) => (b.progress?.ratio ?? 0) - (a.progress?.ratio ?? 0));

  return (
    <>
      {unlocked.length > 0 && (
        <LogrosSection
          title="Desbloqueados"
          eyebrow={`${unlocked.length}`}
          accent
        >
          <LogrosGrid items={unlocked} />
        </LogrosSection>
      )}
      {locked.length > 0 && (
        <LogrosSection title="Por desbloquear" eyebrow={`${locked.length}`}>
          <LogrosGrid items={locked} />
        </LogrosSection>
      )}
    </>
  );
}

// earnedAt survives RSC serialization as Date, but after an IndexedDB
// restore + JSON-based persistence it can arrive as an ISO string.
function toTime(value: Date | string | null | undefined): number {
  if (!value) return 0;
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function LogrosSection({
  title,
  eyebrow,
  accent,
  children,
}: {
  title: string;
  eyebrow: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: accent ? "var(--k-t2)" : "var(--k-t1)",
          }}
        >
          {title}
        </div>
        <span
          className="k-mono"
          style={{ fontSize: 11, color: "var(--k-t3)", letterSpacing: 1.2 }}
        >
          {eyebrow}
        </span>
      </div>
      {children}
    </section>
  );
}

function LogrosGrid({ items }: { items: BadgeDetail[] }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      }}
    >
      {items.map((b) => (
        <TrophyTile key={b.id} badge={b} />
      ))}
    </div>
  );
}

function TrophyTile({ badge }: { badge: BadgeDetail }) {
  const ratio = badge.progress ? Math.round(badge.progress.ratio * 100) : 0;

  return (
    <Link
      href={`/atleta/logros/${badge.code}` as Route}
      aria-label={
        badge.unlocked
          ? `Logro desbloqueado: ${badge.name}`
          : `Logro bloqueado: ${badge.name}`
      }
      style={{ textDecoration: "none" }}
    >
      <div
        className="k-card"
        style={{
          padding: 12,
          background: badge.unlocked ? "var(--k-elevated)" : "var(--k-surface)",
          borderColor: badge.unlocked
            ? "var(--k-accent-line)"
            : "var(--k-line)",
          minHeight: 168,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <BadgeGlyph icon={badge.icon} unlocked={badge.unlocked} />
        <div
          className="k-mono"
          style={{
            fontSize: 9,
            color: badge.unlocked ? "var(--k-accent)" : "var(--k-t3)",
            letterSpacing: 1.2,
          }}
        >
          {badge.unlocked ? "DESBLOQUEADO" : "BLOQUEADO"}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-t1)",
            lineHeight: 1.2,
          }}
        >
          {badge.name}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t2)",
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {badge.description}
        </div>
        {!badge.unlocked && badge.progress && (
          <div style={{ marginTop: "auto" }}>
            <div
              className="k-mono"
              style={{
                fontSize: 10,
                color: "var(--k-t3)",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {badge.progress.human} · {ratio}%
            </div>
            <div
              style={{
                height: 4,
                width: "100%",
                background: "var(--k-line)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {/* transform, not width — animating a layout property reflows
                  the whole grid on every catalog refresh. */}
              <div
                style={{
                  height: "100%",
                  width: "100%",
                  transformOrigin: "left center",
                  transform: `scaleX(${Math.max(0, Math.min(1, badge.progress.ratio))})`,
                  background: "var(--k-t2)",
                  transition: "transform 400ms ease",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
