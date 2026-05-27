import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBadgeDetail, type BadgeDetail } from "@/server/actions/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const badge = await getBadgeDetail(code).catch(() => null);
  if (!badge) return { title: "Logro · Kronos" };
  return { title: `${badge.name} · Kronos` };
}

export default async function BadgeDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const badge = await getBadgeDetail(code);
  if (!badge) notFound();

  return (
    <main
      className="min-h-screen pb-28"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      <div className="px-4 pt-5">
        <Link
          href="/atleta/logros"
          className="k-eyebrow inline-flex items-center gap-1.5"
          style={{ color: "var(--k-t2)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver a logros
        </Link>
      </div>

      <div className="px-4 pt-4">
        <BadgeHero badge={badge} />
      </div>

      <div className="px-4 mt-5 flex flex-col gap-4">
        <CriteriaCard badge={badge} />
        <DescriptionCard badge={badge} />
      </div>
    </main>
  );
}

function BadgeHero({ badge }: { badge: BadgeDetail }) {
  const initial =
    badge.code
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";

  return (
    <div
      className="k-card relative overflow-hidden"
      style={{
        padding: "28px 20px 24px",
        background: badge.unlocked
          ? "linear-gradient(180deg, var(--k-elevated) 0%, var(--k-surface) 100%)"
          : "var(--k-surface)",
        borderColor: badge.unlocked ? "var(--k-line)" : "var(--k-line)",
      }}
    >
      {badge.unlocked && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06), transparent 60%)",
          }}
        />
      )}
      <div className="relative flex flex-col items-center text-center gap-4">
        <div
          aria-hidden="true"
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            background: badge.unlocked
              ? "var(--k-elevated)"
              : "var(--k-line-2)",
            border: `2px solid ${badge.unlocked ? "var(--k-line)" : "var(--k-line)"}`,
            display: "grid",
            placeItems: "center",
            color: badge.unlocked ? "var(--k-t2)" : "var(--k-t3)",
            fontFamily: "var(--k-font-display)",
            fontSize: 48,
            fontWeight: 700,
            boxShadow: badge.unlocked
              ? "0 0 8px rgba(255,255,255,0.06)"
              : undefined,
            opacity: badge.unlocked ? 1 : 0.7,
          }}
        >
          {badge.unlocked ? initial : <LockIcon />}
        </div>

        <div>
          <div
            className="k-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: badge.unlocked ? "var(--k-t2)" : "var(--k-t3)",
              marginBottom: 6,
            }}
          >
            {badge.unlocked ? "DESBLOQUEADO" : "BLOQUEADO"}
            {badge.unlocked && badge.earnedAt
              ? ` · ${formatDate(badge.earnedAt)}`
              : ""}
          </div>
          <h1
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            {badge.name}
          </h1>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              color: "var(--k-t2)",
              lineHeight: 1.4,
              maxWidth: 320,
              margin: "0 auto",
            }}
          >
            {badge.description}
          </div>
        </div>

        <div
          className="k-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            color: "var(--k-t2)",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: "0.12em",
          }}
        >
          +{badge.xp} XP
        </div>
      </div>
    </div>
  );
}

function CriteriaCard({ badge }: { badge: BadgeDetail }) {
  const p = badge.progress;
  const ratio = p ? Math.round(p.ratio * 100) : 0;

  return (
    <div className="k-card" style={{ padding: 16 }}>
      <div
        className="k-mono"
        style={{
          fontSize: 9,
          color: "var(--k-t2)",
          letterSpacing: "0.18em",
          marginBottom: 6,
        }}
      >
        CRITERIO
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 15,
          color: "var(--k-t1)",
          fontWeight: 600,
          marginBottom: 12,
          lineHeight: 1.3,
        }}
      >
        {badge.criteriaHuman}
      </div>

      {p && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <div
              className="k-mono"
              style={{ fontSize: 11, color: "var(--k-t2)" }}
            >
              {p.human}
            </div>
            <div
              className="k-mono"
              style={{
                fontSize: 11,
                color: badge.unlocked ? "var(--k-t2)" : "var(--k-t2)",
                fontWeight: 600,
              }}
            >
              {ratio}%
            </div>
          </div>
          <div
            style={{
              height: 6,
              width: "100%",
              background: "var(--k-line)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${ratio}%`,
                background: badge.unlocked
                  ? "var(--k-t2)"
                  : "linear-gradient(90deg, var(--k-t2), var(--k-t2))",
                transition: "width 600ms ease",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DescriptionCard({ badge }: { badge: BadgeDetail }) {
  if (badge.unlocked) {
    return (
      <div className="k-card" style={{ padding: 16 }}>
        <div
          className="k-mono"
          style={{
            fontSize: 9,
            color: "var(--k-t2)",
            letterSpacing: "0.18em",
            marginBottom: 6,
          }}
        >
          ¡LO TIENES!
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t1)",
            lineHeight: 1.4,
          }}
        >
          Comparte este logro. Cada PR cuenta una historia.
        </div>
        <button
          disabled
          style={{
            marginTop: 12,
            background: "var(--k-elevated)",
            color: "var(--k-t3)",
            border: "1px solid var(--k-line)",
            borderRadius: 12,
            padding: "10px 16px",
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "not-allowed",
          }}
        >
          Compartir · Pronto
        </button>
      </div>
    );
  }

  return (
    <div className="k-card" style={{ padding: 16 }}>
      <div
        className="k-mono"
        style={{
          fontSize: 9,
          color: "var(--k-t2)",
          letterSpacing: "0.18em",
          marginBottom: 6,
        }}
      >
        CÓMO DESBLOQUEARLO
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 14,
          color: "var(--k-t1)",
          lineHeight: 1.4,
        }}
      >
        Sigue entrenando. Tu próxima clase, score o PR puede acercarte. Cuando
        cumplas el criterio, el logro se desbloquea automáticamente.
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width={36}
      height={36}
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

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
