"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  BodyMetricHistoryPoint,
  LatestByType,
} from "@/server/actions/body-metrics";
import type { GoalRow } from "@/server/actions/goals";
import { WellnessHero } from "./WellnessHero";
import { WeightChart } from "./WeightChart";
import { MeasurementsGrid } from "./MeasurementsGrid";
import { LogMeasurementModal } from "./LogMeasurementModal";
import { EmptyState } from "./EmptyState";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { saludTour } from "@/components/tour/tours/salud";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";

type Props = {
  history: BodyMetricHistoryPoint[];
  latest: LatestByType[];
  goals: GoalRow[];
};

export function SaludShell({ history, latest, goals }: Props) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [, startRefresh] = useTransition();

  const isEmpty = latest.length === 0 && history.length === 0;
  const activeWeightGoal =
    goals.find((g) => g.status === "ACTIVE" && g.unit === "kg") ?? null;
  const otherGoals = goals.filter((g) => g !== activeWeightGoal);

  function handleSaved() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Audit 2026-09-15: at 360 the title was squeezed into three lines
          against the "?" and "+ REGISTRAR" controls. The title now owns a full
          row and the actions sit in their own row beneath it. */}
      <header style={{ margin: "0 16px 6px", paddingTop: 36 }}>
        <div className="pl-12 lg:pl-0" style={{ marginBottom: 4 }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--k-t2)",
            textTransform: "uppercase",
          }}
        >
          Salud
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--k-t1)",
            letterSpacing: "-0.02em",
            margin: "2px 0 0",
            lineHeight: 1.15,
            textWrap: "balance",
          }}
        >
          Tu cuerpo en el tiempo
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          {!isEmpty && (
            <button
              type="button"
              data-tour="salud.register"
              onClick={() => setLogOpen(true)}
              className="k-tap"
              aria-label="Registrar nueva medición"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                padding: "11px 16px",
                background: "var(--k-accent)",
                color: "var(--k-accent-on)",
                border: "none",
                borderRadius: 10,
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "var(--k-accent-glow)",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} aria-hidden />
              Registrar
            </button>
          )}
          <div style={{ marginLeft: "auto" }}>
            <TourTriggerButton tourId={saludTour.id} />
          </div>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState onLog={() => setLogOpen(true)} />
      ) : (
        <>
          <div data-tour="salud.hero">
            <WellnessHero latest={latest} />
          </div>
          <div data-tour="salud.chart">
            <WeightChart
              data={history}
              targetValue={activeWeightGoal?.targetValue ?? null}
              unit="kg"
            />
          </div>

          {activeWeightGoal && (
            <div data-tour="salud.goal">
              <GoalCard
                goal={activeWeightGoal}
                onEdit={() => setGoalOpen(true)}
                onChanged={handleSaved}
              />
            </div>
          )}
          {otherGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setGoalOpen(true)}
              onChanged={handleSaved}
            />
          ))}
          {goals.length === 0 && (
            <button
              type="button"
              data-tour="salud.goal"
              onClick={() => setGoalOpen(true)}
              className="k-tap"
              style={{
                margin: "0 16px 18px",
                minHeight: 44,
                padding: "14px 18px",
                background: "transparent",
                color: "var(--k-t2)",
                border: "1px dashed var(--k-line)",
                borderRadius: 14,
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                width: "calc(100% - 32px)",
              }}
            >
              + Crear meta de composición
            </button>
          )}

          <MeasurementsGrid latest={latest} />
        </>
      )}

      <LogMeasurementModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={handleSaved}
      />
      <GoalForm
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        onSaved={handleSaved}
        latest={latest}
      />
    </div>
  );
}
