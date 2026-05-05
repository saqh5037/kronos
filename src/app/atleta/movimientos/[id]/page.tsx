import { notFound } from "next/navigation";
import { getMyMovementProfile } from "@/server/analytics/movement";
import {
  getMyPRProgression,
  type PRProgressionResult,
} from "@/server/actions/prs";
import { PRChart, type PRChartPoint } from "@/components/charts/PRChart";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";

export const metadata = { title: "Kronos — Movimiento" };

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: Awaited<ReturnType<typeof getMyMovementProfile>> = null;
  let progression: PRProgressionResult | null = null;

  try {
    [profile, progression] = await Promise.all([
      getMyMovementProfile(id),
      getMyPRProgression(id, 180),
    ]);
  } catch {
    notFound();
  }

  if (!profile) notFound();

  const chartData: PRChartPoint[] =
    progression?.points.map((p) => ({
      date: p.date ?? "",
      value: p.value,
      delta: p.deltaPct ?? 0,
      isCurrentBest: p.isCurrentBest ?? false,
    })) ?? [];

  return (
    <div className="pb-28">
      {/* Header */}
      <AnimatedSection className="px-[18px] pt-14 pb-3">
        <AnimatedItem>
          <p className="k-eyebrow mb-1">MOVIMIENTO</p>
          <h1 className="font-display font-bold text-2xl">
            {profile.movementName}
          </h1>
        </AnimatedItem>
      </AnimatedSection>

      {/* Stats Grid */}
      <AnimatedSection className="px-3.5 grid grid-cols-2 gap-2">
        <AnimatedItem>
          <KCard variant="flat" className="p-3.5 text-center">
            <div
              className="font-display text-xl font-bold"
              style={{ color: "var(--fire)" }}
            >
              {profile.currentBest !== null
                ? `${profile.currentBest}${profile.unit ? ` ${profile.unit}` : ""}`
                : "—"}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide mt-1"
              style={{ color: "var(--text-3)" }}
            >
              PR ACTUAL{" "}
              {profile.currentBest
                ? profile.lastPR?.achievedAt
                  ? `· ${new Date(profile.lastPR.achievedAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`
                  : ""
                : ""}
            </div>
          </KCard>
        </AnimatedItem>

        <AnimatedItem>
          <KCard variant="flat" className="p-3.5 text-center">
            <div
              className="font-display text-xl font-bold"
              style={{ color: "var(--moss)" }}
            >
              {profile.percentileInBox}%
            </div>
            <div
              className="text-[10px] font-bold tracking-wide mt-1"
              style={{ color: "var(--text-3)" }}
            >
              PERCENTIL EN BOX
            </div>
          </KCard>
        </AnimatedItem>

        <AnimatedItem>
          <KCard variant="flat" className="p-3.5 text-center">
            <div
              className="font-display text-xl font-bold"
              style={{ color: "var(--steel)" }}
            >
              #{profile.rankInBox}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide mt-1"
              style={{ color: "var(--text-3)" }}
            >
              RANK DE {profile.totalAthletesInBox}
            </div>
          </KCard>
        </AnimatedItem>

        <AnimatedItem>
          <KCard variant="flat" className="p-3.5 text-center">
            <div
              className="font-display text-xl font-bold"
              style={{ color: "var(--amber)" }}
            >
              {profile.frequency90d}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide mt-1"
              style={{ color: "var(--text-3)" }}
            >
              ENTRENOS 90D
            </div>
          </KCard>
        </AnimatedItem>
      </AnimatedSection>

      {/* Progression Chart */}
      <AnimatedSection className="px-3.5 mt-4">
        <AnimatedItem>
          <KCard className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[13px] font-semibold">
                Progresión de PRs
              </span>
              <span
                className="text-[10px] font-bold tracking-wide"
                style={{ color: "var(--text-3)" }}
              >
                ÚLTIMOS 6 MESES
              </span>
            </div>
            <PRChart
              data={chartData}
              unit={progression?.unit}
              currentBest={progression?.currentBest}
              height={220}
            />
            {progression && progression.totalAttempts > 0 && (
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="text-center">
                  <div className="font-display text-sm font-bold">
                    {progression.totalAttempts}
                  </div>
                  <div
                    className="text-[9px] font-bold tracking-wide"
                    style={{ color: "var(--text-3)" }}
                  >
                    INTENTOS
                  </div>
                </div>
                {progression.daysSinceLast !== null && (
                  <div className="text-center">
                    <div className="font-display text-sm font-bold">
                      {progression.daysSinceLast}d
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-wide"
                      style={{ color: "var(--text-3)" }}
                    >
                      ÚLTIMO
                    </div>
                  </div>
                )}
              </div>
            )}
          </KCard>
        </AnimatedItem>
      </AnimatedSection>

      {/* Stale warning */}
      {profile.isStale && (
        <AnimatedSection className="px-3.5 mt-4">
          <AnimatedItem>
            <div
              className="k-card-ghost p-4 flex items-center gap-3"
              style={{
                borderColor: "var(--ember-line)",
                background: "var(--ember-soft)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ember)"
                strokeWidth="2"
              >
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              <div>
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--ember)" }}
                >
                  Movimiento sin entrenar
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
                  Hace más de 30 días que no registras un PR. ¡Ponle foco!
                </div>
              </div>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      )}
    </div>
  );
}
