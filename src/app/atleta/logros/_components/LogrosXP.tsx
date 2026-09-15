/**
 * XP + level summary for the trophy room.
 *
 * Audit 2026-09-15: "LOGROS · 0 XP" sat directly above four unlocked badges
 * while a badge page promised "+50 XP". Both numbers now come from
 * `getCollectionStats`, which reconciles and then reads the XP ledger — there
 * is no second source left to disagree with.
 */

import { getCollectionStats } from "@/server/actions/badges";

export async function LogrosXPHeader() {
  const stats = await getCollectionStats().catch(() => null);
  if (!stats) return null;

  const { level, xpTotal, unlockedCount, totalCount } = stats;
  const pct = Math.round(level.progressToNext * 100);

  return (
    <section className="px-4">
      <div className="k-card" style={{ padding: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              className="k-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--k-t3)",
              }}
            >
              NIVEL {level.level}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 26,
                fontWeight: 700,
                color: "var(--k-t1)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {xpTotal} XP
            </div>
          </div>
          <div
            className="k-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--k-t2)",
              textAlign: "right",
            }}
          >
            {unlockedCount} / {totalCount}
            <br />
            LOGROS
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            height: 4,
            borderRadius: 2,
            background: "var(--k-line)",
            overflow: "hidden",
          }}
        >
          {/* scaleX instead of width: animating a layout property forces a
              reflow on a mid-range phone (impeccable detector, technical audit). */}
          <div
            style={{
              height: "100%",
              width: "100%",
              transformOrigin: "left center",
              transform: `scaleX(${Math.max(0, Math.min(1, level.progressToNext))})`,
              background: "var(--k-accent)",
              transition: "transform 400ms ease",
            }}
          />
        </div>
        <div
          className="k-mono"
          style={{
            marginTop: 6,
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--k-t3)",
          }}
        >
          {level.xpToNext === null
            ? "NIVEL MÁXIMO"
            : `${level.xpToNext} XP PARA EL NIVEL ${level.level + 1} · ${pct}%`}
        </div>
      </div>
    </section>
  );
}

export function LogrosXPHeaderSkeleton() {
  return (
    <section className="px-4">
      <div
        className="k-card k-skeleton"
        style={{ height: 104, borderRadius: 12 }}
      />
    </section>
  );
}
