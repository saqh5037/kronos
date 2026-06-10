import {
  getBodyMetricsHistory,
  getLatestByType,
} from "@/server/actions/body-metrics";
import { listMyWellnessGoals } from "@/server/actions/goals";
import { SaludShell } from "./SaludShell";

export async function SaludContent() {
  const [history, latest, goals] = await Promise.all([
    getBodyMetricsHistory("WEIGHT", 90),
    getLatestByType(),
    listMyWellnessGoals(),
  ]);

  return <SaludShell history={history} latest={latest} goals={goals} />;
}

export function SaludContentSkeleton() {
  return (
    <div className="pb-28 px-4 pt-6 space-y-5">
      {/* Wellness hero skeleton */}
      <div
        className="k-card k-skeleton"
        style={{ height: 140, borderRadius: 16 }}
      />
      {/* Chart skeleton */}
      <div
        className="k-card k-skeleton"
        style={{ height: 200, borderRadius: 16 }}
      />
      {/* Measurements grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="k-card k-skeleton"
            style={{ height: 90, borderRadius: 12 }}
          />
        ))}
      </div>
    </div>
  );
}
