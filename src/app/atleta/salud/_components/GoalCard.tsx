"use client";

import { useTransition } from "react";
import type { GoalRow } from "@/server/actions/goals";
import { cancelGoal } from "@/server/actions/goals";
import { useConfirm } from "@/lib/use-confirm";

type Props = {
  goal: GoalRow;
  onEdit: () => void;
  onChanged: () => void;
};

const METRIC_COPY: Record<string, string> = {
  kg: "Peso objetivo",
  "%": "% Grasa objetivo",
};

export function GoalCard({ goal, onEdit, onChanged }: Props) {
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  const title = METRIC_COPY[goal.unit] ?? "Composición objetivo";
  const progress = goal.progress.pct;
  const achieved = goal.progress.achieved || goal.status === "ACHIEVED";
  const expired = goal.status === "EXPIRED";

  const start = goal.startValue ?? goal.currentValue;
  const delta = goal.currentValue - start;
  const targetDelta = goal.targetValue - start;
  const direction = goal.targetValue < start ? "descending" : "ascending";

  const deltaSoFar = Math.abs(Math.round(delta * 10) / 10);
  const totalAbs = Math.abs(Math.round(targetDelta * 10) / 10);
  const verb = direction === "descending" ? "perdido" : "ganado";

  async function handleCancel() {
    const ok = await confirm({
      title: "¿Cancelar esta meta?",
      message: "Podrás crear una nueva cuando quieras.",
      confirmLabel: "Cancelar meta",
      cancelLabel: "Volver",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await cancelGoal(goal.id);
        onChanged();
      } catch (err) {
        console.error(err);
      }
    });
  }

  const accent = achieved
    ? "var(--k-accent)"
    : expired
      ? "var(--k-warning)"
      : "var(--k-accent)";

  return (
    <div
      style={{
        margin: "0 16px 18px",
        padding: "18px 18px 16px",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: accent,
              textTransform: "uppercase",
            }}
          >
            {achieved ? "Meta lograda" : expired ? "Meta vencida" : "Mi meta"}
          </div>
          <div
            style={{
              marginTop: 2,
              fontFamily: "var(--k-font-display)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--k-t1)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}: {goal.targetValue} {goal.unit}
          </div>
        </div>
        {!achieved && !expired && (
          <button
            type="button"
            onClick={onEdit}
            className="k-tap"
            style={{
              background: "transparent",
              border: "1px solid var(--k-line)",
              color: "var(--k-t2)",
              padding: "6px 10px",
              borderRadius: 8,
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Editar
          </button>
        )}
      </div>

      <div>
        <div
          aria-hidden
          style={{
            height: 10,
            background: "var(--k-bg)",
            border: "1px solid var(--k-line)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: accent,
              boxShadow: "var(--k-accent-glow)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--k-t2)",
            letterSpacing: "0.04em",
          }}
        >
          <span>
            {deltaSoFar} {goal.unit} {verb} · de {totalAbs} {goal.unit}
          </span>
          <span style={{ color: accent }}>{Math.round(progress)}%</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontFamily: "var(--k-font-body)",
          fontSize: 12,
          color: "var(--k-t3)",
        }}
      >
        <span>
          {achieved
            ? "Lograste tu meta. ¡A por la siguiente!"
            : expired
              ? "Renueva tu meta cuando estés listo."
              : `${goal.progress.daysLeft} día${
                  goal.progress.daysLeft === 1 ? "" : "s"
                } restante${goal.progress.daysLeft === 1 ? "" : "s"}`}
        </span>
        {!achieved && !expired && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="k-tap"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--k-t3)",
              padding: 0,
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: isPending ? "wait" : "pointer",
              textDecoration: "underline",
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
