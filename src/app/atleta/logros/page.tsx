import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import {
  listBadgesWithProgress,
  getCollectionStats,
  type BadgeDetail,
} from "@/server/actions/badges";
import { badgeTierLabel } from "@/lib/badges/tier";

export const metadata: Metadata = { title: "Logros · Kronos" };
export const dynamic = "force-dynamic";

export default async function TrophyRoomPage() {
  const [all, stats] = await Promise.all([
    listBadgesWithProgress(),
    getCollectionStats(),
  ]);

  const accessible = all.filter((b) => !b.isAboveTier);
  const teasers = all.filter((b) => b.isAboveTier);

  const unlocked = accessible
    .filter((b) => b.unlocked)
    .sort(
      (a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0),
    );
  const upcoming = accessible
    .filter((b) => !b.unlocked)
    .sort((a, b) => (b.progress?.ratio ?? 0) - (a.progress?.ratio ?? 0));

  return (
    <main
      className="min-h-screen pb-28"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      <header className="px-4 pt-6 pb-4">
        <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          TROPHY ROOM · ATLETA
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1.05,
            marginTop: 4,
          }}
        >
          Tu colección
        </h1>
        {stats && <XPHero stats={stats} />}
      </header>

      {all.length === 0 && (
        <div className="px-4">
          <div
            className="k-card"
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
            }}
          >
            Todavía no hay logros configurados. Empieza a registrar WODs y PRs
            para irlos desbloqueando.
          </div>
        </div>
      )}

      {unlocked.length > 0 && (
        <Section title="Desbloqueados" eyebrow={`${unlocked.length}`} accent>
          <Grid items={unlocked} />
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Por desbloquear" eyebrow={`${upcoming.length}`}>
          <Grid items={upcoming} />
        </Section>
      )}

      {teasers.length > 0 && (
        <Section
          title="Otros niveles"
          eyebrow={`${teasers.length}`}
          subtitle="Sube de nivel para acceder"
        >
          <Grid items={teasers} />
        </Section>
      )}
    </main>
  );
}

function XPHero({
  stats,
}: {
  stats: NonNullable<Awaited<ReturnType<typeof getCollectionStats>>>;
}) {
  const pct = Math.round(stats.level.progressToNext * 100);
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        background: "var(--k-surface)",
        border: "1px solid var(--k-accent-line)",
        borderRadius: 16,
        boxShadow: "var(--k-accent-glow)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--k-accent)",
            textTransform: "uppercase",
          }}
        >
          Nivel atleta {stats.level.level}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--k-t3)",
          }}
        >
          {stats.unlockedCount}/{stats.totalCount} DESBLOQUEADOS
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--k-accent)",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {stats.xpTotal}
        </div>
        <div style={{ paddingBottom: 6 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--k-t3)",
            }}
          >
            XP
          </div>
        </div>
      </div>
      <div
        style={{
          height: 4,
          background: "var(--k-line)",
          borderRadius: 2,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--k-accent)",
            borderRadius: 2,
            transition: "width 800ms ease",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "var(--k-t3)",
        }}
      >
        {stats.level.xpToNext !== null
          ? `${stats.level.xpToNext} XP AL NIVEL ${stats.level.level + 1}`
          : "NIVEL MÁXIMO ALCANZADO"}
      </div>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  subtitle,
  accent,
  children,
}: {
  title: string;
  eyebrow: string;
  subtitle?: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 mt-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: accent ? "var(--k-accent)" : "var(--k-t1)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 11,
                color: "var(--k-t3)",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span
          className="k-mono"
          style={{
            fontSize: 11,
            color: "var(--k-t3)",
            letterSpacing: 1.2,
          }}
        >
          {eyebrow}
        </span>
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: BadgeDetail[] }) {
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
  const initial =
    badge.code
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";
  const ratio = badge.progress ? Math.round(badge.progress.ratio * 100) : 0;
  const isTeaser = badge.isAboveTier;

  return (
    <Link
      href={`/atleta/logros/${badge.code}` as Route}
      aria-label={
        badge.unlocked
          ? `Logro desbloqueado: ${badge.name}`
          : isTeaser
            ? `Logro de tier superior: ${badge.name}`
            : `Logro bloqueado: ${badge.name}`
      }
      style={{ textDecoration: "none" }}
    >
      <div
        className="k-card"
        style={{
          padding: 12,
          background: badge.unlocked ? "var(--k-elevated)" : "var(--k-surface)",
          opacity: badge.unlocked ? 1 : isTeaser ? 0.45 : 0.7,
          borderColor: badge.unlocked
            ? "var(--k-accent-line)"
            : "var(--k-line)",
          minHeight: 168,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: badge.unlocked
              ? "var(--k-accent-soft)"
              : "var(--k-line-2)",
            border: `1px solid ${badge.unlocked ? "var(--k-accent-line)" : "var(--k-line)"}`,
            display: "grid",
            placeItems: "center",
            color: badge.unlocked ? "var(--k-accent)" : "var(--k-t3)",
            fontFamily: "var(--k-font-display)",
            fontSize: 18,
            fontWeight: 600,
            boxShadow: badge.unlocked ? "var(--k-accent-glow)" : undefined,
          }}
        >
          {badge.unlocked ? initial : <SmallLockIcon />}
        </div>
        <div
          className="k-mono"
          style={{
            fontSize: 9,
            color: badge.unlocked ? "var(--k-accent)" : "var(--k-t3)",
            letterSpacing: 1.2,
          }}
        >
          {badge.unlocked
            ? `+${badge.xp} XP`
            : isTeaser && badge.tier
              ? `NIVEL ${badgeTierLabel(badge.tier).toUpperCase()}`
              : "BLOQUEADO"}
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
        {!badge.unlocked && !isTeaser && badge.progress && (
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
              <div
                style={{
                  height: "100%",
                  width: `${ratio}%`,
                  background: "var(--k-accent)",
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function SmallLockIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
