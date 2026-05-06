"use client";

import {
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "./tokens";

export type CapabilityCategory = {
  category: string;
  name: string;
  score: number;
  rawValue: number;
  movementCount: number;
};

type Props = {
  categories: CapabilityCategory[];
  overallRank: number;
  totalAthletes: number;
  weakestCategory: string | null;
  strongestCategory: string | null;
  height?: number;
};

export function CapabilityRadar({
  categories,
  overallRank,
  totalAthletes,
  weakestCategory,
  strongestCategory,
  height = 280,
}: Props) {
  const data = categories.map((c) => ({
    name: c.name,
    score: Math.round(c.score),
    fullMark: 100,
    category: c.category,
  }));

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{ height, color: "var(--text-3)" }}
      >
        Sin datos de capacidades
      </div>
    );
  }

  const hasRank = overallRank > 0 && totalAthletes > 0;

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <RRadarChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
        >
          <PolarGrid stroke={CHART_COLORS.grid} radialLines={true} />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: CHART_COLORS.text2, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: CHART_COLORS.text3 }}
            tickCount={5}
            stroke={CHART_COLORS.grid}
          />
          <Radar
            name="Capacidad"
            dataKey="score"
            stroke={CHART_COLORS.fire}
            fill={CHART_COLORS.fire}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RRadarChart>
      </ResponsiveContainer>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {hasRank && (
          <div className="text-center">
            <div
              className="font-display text-lg font-bold"
              style={{ color: "var(--fire)" }}
            >
              #{overallRank}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide"
              style={{ color: "var(--text-3)" }}
            >
              DE {totalAthletes}
            </div>
          </div>
        )}
        {strongestCategory && (
          <div className="text-center">
            <div
              className="font-display text-lg font-bold"
              style={{ color: "var(--moss)" }}
            >
              {strongestCategory}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide"
              style={{ color: "var(--text-3)" }}
            >
              MÁS FUERTE
            </div>
          </div>
        )}
        {weakestCategory && (
          <div className="text-center">
            <div
              className="font-display text-lg font-bold"
              style={{ color: "var(--ember)" }}
            >
              {weakestCategory}
            </div>
            <div
              className="text-[10px] font-bold tracking-wide"
              style={{ color: "var(--text-3)" }}
            >
              A MEJORAR
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="mt-4 space-y-2">
        {categories.map((c) => (
          <div key={c.category} className="flex items-center gap-3">
            <div
              className="w-16 text-[11px] font-semibold truncate"
              style={{ color: "var(--text-2)" }}
            >
              {c.name}
            </div>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "var(--track)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, c.score))}%`,
                  background:
                    c.score >= 70
                      ? "var(--moss)"
                      : c.score >= 40
                        ? "var(--amber)"
                        : "var(--ember)",
                }}
              />
            </div>
            <div
              className="w-8 text-right text-[11px] font-bold font-mono"
              style={{ color: "var(--text)" }}
            >
              {Math.round(c.score)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
