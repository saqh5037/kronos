import { listWODOptions } from "@/server/actions/leaderboards";
import HistorialView from "../HistorialView";

export async function HistorialContent() {
  const wodOptions = await listWODOptions();
  return <HistorialView wodOptions={wodOptions} />;
}

export function HistorialContentSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-3">
      {/* Filter bar skeleton */}
      <div
        className="k-card k-skeleton"
        style={{ height: 44, borderRadius: 12 }}
      />
      {/* List rows skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="k-card k-skeleton"
          style={{ height: 68, borderRadius: 12 }}
        />
      ))}
    </div>
  );
}
