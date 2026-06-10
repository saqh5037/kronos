import { listBadgesWithProgress } from "@/server/actions/badges";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import Link from "next/link";
import type { Route } from "next";
import type { BadgeDetail } from "@/server/actions/badges";

export async function LogrosContent() {
  const all = await listBadgesWithProgress();

  const unlocked = all
    .filter((b) => b.unlocked)
    .sort(
      (a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0),
    );
  const locked = all
    .filter((b) => !b.unlocked)
    .sort((a, b) => (b.progress?.ratio ?? 0) - (a.progress?.ratio ?? 0));

  const total = all.length;

  if (total === 0) {
    return (
      <div className="px-4">
        <EmptyStateCTA
          title="Aún no hay logros disponibles"
          description="Los logros se desbloquean cuando alcanzas metas de entrenamiento. Mientras tanto, sigue registrando tus WODs y PRs."
          ctaLabel="Ver WOD de hoy"
          ctaHref="/atleta/wod"
          secondaryLabel="Explorar movimientos"
          secondaryHref="/atleta/movimientos"
        />
      </div>
    );
  }

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
  const initial =
    badge.code
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";
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
          opacity: badge.unlocked ? 1 : 0.7,
          borderColor: badge.unlocked ? "var(--k-line)" : "var(--k-line)",
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
              ? "var(--k-elevated)"
              : "var(--k-line-2)",
            border: `1px solid ${badge.unlocked ? "var(--k-line)" : "var(--k-line)"}`,
            display: "grid",
            placeItems: "center",
            color: badge.unlocked ? "var(--k-t2)" : "var(--k-t3)",
            fontFamily: "var(--k-font-display)",
            fontSize: 18,
            fontWeight: 600,
            boxShadow: badge.unlocked
              ? "0 0 8px rgba(255,255,255,0.06)"
              : undefined,
          }}
        >
          {badge.unlocked ? initial : <SmallLockIcon />}
        </div>
        <div
          className="k-mono"
          style={{
            fontSize: 9,
            color: badge.unlocked ? "var(--k-t2)" : "var(--k-t3)",
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
              <div
                style={{
                  height: "100%",
                  width: `${ratio}%`,
                  background: "var(--k-t1)",
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

export function LogrosContentSkeleton() {
  return (
    <div className="px-4 mt-4 space-y-4">
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="k-card k-skeleton"
            style={{ minHeight: 168, borderRadius: 12 }}
          />
        ))}
      </div>
    </div>
  );
}
