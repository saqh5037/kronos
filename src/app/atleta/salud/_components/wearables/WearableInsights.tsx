import {
  getMyLatestRecovery,
  getMyRecoveryTrend,
  getMySleepTrend,
  getMySportBreakdown,
  getMyStrainTrend,
  type RecoverySnapshot,
  type RecoveryTrendPoint,
  type SleepTrendPoint,
  type SportBreakdownRow,
  type StrainTrendPoint,
} from "@/server/actions/wearables";
import { RecoveryCard } from "./RecoveryCard";
import { SleepCard } from "./SleepCard";
import { StrainCard } from "./StrainCard";
import { SportsCard } from "./SportsCard";

/**
 * The Whoop data Kronos has synced for months and never renders. Sits between
 * the body-metric shell and `DevicesCard`: connect/reconnect stays the honest
 * status card at the bottom, this is what connecting actually buys you.
 */
export async function WearableInsights() {
  let latestRecovery: RecoverySnapshot | null = null;
  let recoveryTrend: RecoveryTrendPoint[] = [];
  let sleepTrend: SleepTrendPoint[] = [];
  let strainTrend: StrainTrendPoint[] = [];
  let sportBreakdown: SportBreakdownRow[] = [];

  try {
    [latestRecovery, recoveryTrend, sleepTrend, strainTrend, sportBreakdown] =
      await Promise.all([
        getMyLatestRecovery(),
        getMyRecoveryTrend(30),
        getMySleepTrend(30),
        getMyStrainTrend(30),
        getMySportBreakdown(90),
      ]);
  } catch {
    // Sin sesión o sin perfil de atleta — cada card ya sabe mostrar su estado vacío.
  }

  return (
    <div className="flex flex-col" style={{ margin: "0 16px 20px", gap: 12 }}>
      <RecoveryCard latest={latestRecovery} trend={recoveryTrend} />
      <SleepCard trend={sleepTrend} />
      <StrainCard trend={strainTrend} />
      <SportsCard breakdown={sportBreakdown} />
    </div>
  );
}

export function WearableInsightsSkeleton() {
  return (
    <div className="flex flex-col" style={{ margin: "0 16px 20px", gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="k-card k-skeleton"
          style={{ height: 160, borderRadius: 14 }}
        />
      ))}
    </div>
  );
}
