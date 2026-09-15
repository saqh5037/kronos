import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import BadgeShareCanvas from "@/components/atleta/BadgeShareCanvas";
import {
  getBadgeDetail,
  getMyAthleteFirstName,
  type BadgeDetail,
} from "@/server/actions/badges";
import { badgeCelebrationCopy } from "@/lib/badges/progress";
import { formatDateLong } from "@/lib/format";
import { BadgeGlyph } from "../_components/BadgeGlyph";

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

  const firstName = badge.unlocked
    ? await getMyAthleteFirstName().catch(() => null)
    : null;

  return (
    <main
      className="min-h-screen pb-28"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      {/* The back link gets its own row with a left gutter so the fixed
          hamburger (12 px + 40 px) stops clipping it into "LVER A LOGROS". */}
      <div className="pt-5 pr-4 pl-12 lg:pl-4">
        <AthleteBackLink href="/atleta/logros" label="Logros" />
      </div>

      <div className="px-4 pt-2">
        <BadgeHero badge={badge} />
      </div>

      <div className="px-4 mt-5 flex flex-col gap-4">
        <CriteriaCard badge={badge} />
        <DescriptionCard badge={badge} athleteName={firstName ?? "Atleta"} />
      </div>
    </main>
  );
}

function BadgeHero({ badge }: { badge: BadgeDetail }) {
  return (
    <div
      className="k-card relative overflow-hidden"
      style={{
        padding: "28px 20px 24px",
        background: badge.unlocked
          ? "linear-gradient(180deg, var(--k-elevated) 0%, var(--k-surface) 100%)"
          : "var(--k-surface)",
        borderColor: badge.unlocked ? "var(--k-accent-line)" : "var(--k-line)",
      }}
    >
      {badge.unlocked && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(200,255,45,0.10), transparent 60%)",
          }}
        />
      )}
      <div className="relative flex flex-col items-center text-center gap-4">
        <BadgeGlyph icon={badge.icon} unlocked={badge.unlocked} size={120} />

        <div>
          <div
            className="k-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: badge.unlocked ? "var(--k-accent)" : "var(--k-t3)",
              marginBottom: 6,
            }}
          >
            {badge.unlocked ? "DESBLOQUEADO" : "BLOQUEADO"}
            {badge.unlocked && badge.earnedAt
              ? ` · ${formatDateLong(new Date(badge.earnedAt))}`
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

        {/* Unlocked: the XP is already in the ledger the home reads, so say so
            instead of promising a reward twice. */}
        <div
          className="k-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: badge.unlocked
              ? "var(--k-accent-soft)"
              : "var(--k-elevated)",
            border: `1px solid ${badge.unlocked ? "var(--k-accent-line)" : "var(--k-line)"}`,
            color: badge.unlocked ? "var(--k-accent)" : "var(--k-t2)",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: "0.12em",
          }}
        >
          {badge.unlocked ? `${badge.xp} XP SUMADOS` : `VALE ${badge.xp} XP`}
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
                color: badge.unlocked ? "var(--k-accent)" : "var(--k-t2)",
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
            {/* transform, not width (layout-property animation). */}
            <div
              style={{
                height: "100%",
                width: "100%",
                transformOrigin: "left center",
                transform: `scaleX(${Math.max(0, Math.min(1, p.ratio))})`,
                background: badge.unlocked ? "var(--k-accent)" : "var(--k-t2)",
                transition: "transform 600ms ease",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DescriptionCard({
  badge,
  athleteName,
}: {
  badge: BadgeDetail;
  athleteName: string;
}) {
  if (badge.unlocked) {
    return (
      <div className="k-card" style={{ padding: 16 }}>
        <div
          className="k-mono"
          style={{
            fontSize: 9,
            color: "var(--k-accent)",
            letterSpacing: "0.18em",
            marginBottom: 6,
          }}
        >
          LO TIENES
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t1)",
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          {/* Celebration copy per badge: a first class is no longer
              congratulated with "Cada PR cuenta una historia". */}
          {badgeCelebrationCopy(badge.code, badge.name)}
        </div>
        <BadgeShareCanvas
          athleteName={athleteName}
          badgeName={badge.name}
          badgeCode={badge.code}
          badgeDescription={badge.description}
          earnedAtISO={new Date(badge.earnedAt ?? Date.now()).toISOString()}
          xp={badge.xp}
        />
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
