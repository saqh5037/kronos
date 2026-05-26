/**
 * PredictionsSection — AI-powered next PR predictions.
 * Optional: try/catch → null so a slow/failing AI call never blocks the page.
 */

import { getTop3PRPredictions } from "@/server/actions/ai";
import PRPredictionCard from "@/components/atleta/PRPredictionCard";
import { AnimatedSection } from "@/components/kronos/AnimatedSection";

export async function PredictionsSection() {
  let prPredictions = [];
  try {
    prPredictions = await getTop3PRPredictions();
  } catch {
    return null;
  }

  if (prPredictions.length === 0) return null;

  return (
    <AnimatedSection className="mt-6">
      <div className="flex items-baseline justify-between px-[18px] pb-2.5">
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          Próximos PRs · Kronos AI
        </span>
        <div
          className="font-mono text-[10px] font-bold tracking-[0.12em]"
          style={{ color: "var(--k-t3)" }}
        >
          REGRESIÓN + IA
        </div>
      </div>
      <div className="px-3.5 grid grid-cols-1 gap-2.5">
        {prPredictions.map((card) => (
          <PRPredictionCard key={card.movementId} card={card} />
        ))}
      </div>
    </AnimatedSection>
  );
}
