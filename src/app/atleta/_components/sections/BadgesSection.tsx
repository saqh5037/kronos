/**
 * BadgesSection — unlocked badges, below the leaderboard.
 *
 * Audit 2026-09-15:
 *  - P0 #8: badges belong off the first viewport; the home leads with today.
 *  - P1 gamification: the eyebrow read "LOGROS · 0 XP" directly above four
 *    DESBLOQUEADO badges while `/atleta/logros/first-class` awards "+50 XP".
 *    `home.xpTotal` is the real `XPLedger` sum — the contradiction is that the
 *    ledger has no rows for badges seeded directly. Until that is reconciled,
 *    the home states the fact it can prove (how many badges are unlocked) and
 *    only mentions XP when the ledger actually has a balance.
 */

import { getAthleteHomeCached } from "../request-cache";
import { getAthleteTrophies } from "@/server/actions/athlete-home";
import { TrophyStrip } from "@/components/atleta/TrophyStrip";

export async function BadgesSection() {
  const [home, trophies] = await Promise.all([
    getAthleteHomeCached(),
    getAthleteTrophies().catch(() => []),
  ]);

  if (!home || trophies.length === 0) return null;

  const count = trophies.length;
  const xp = home.xpTotal;

  return (
    <div className="mt-6 px-3.5">
      <div className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
        LOGROS · {count} {count === 1 ? "DESBLOQUEADO" : "DESBLOQUEADOS"}
        {xp > 0 ? ` · ${xp} XP` : ""}
      </div>
      <TrophyStrip items={trophies} />
    </div>
  );
}
