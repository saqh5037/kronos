import { getSkillContextualPRPredictions } from "@/server/actions/skills";
import KCard from "@/components/kronos/KCard";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";

interface Props {
  skillId: string;
}

export async function AIPlanSection({ skillId }: Props) {
  const prPredictions = await getSkillContextualPRPredictions(skillId).catch(
    () => [],
  );

  if (!prPredictions || prPredictions.length === 0) return null;

  return (
    <RevealOnScroll
      data-tour="skills.ai-plan"
      variant="fade-up"
      className="px-3.5 mb-4"
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
          padding: "0 4px",
        }}
      >
        <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          TU PLAN · KRONOS AI
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--k-t3)",
          }}
        >
          REGRESIÓN + IA
        </span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {prPredictions.slice(0, 2).map((card) => (
          <KCard key={card.movementId}>
            <div
              style={{
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--k-t1)",
                  }}
                >
                  {card.movementName}
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 11,
                    color: "var(--k-t2)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {card.narrative}
                </div>
              </div>
            </div>
          </KCard>
        ))}
      </div>
    </RevealOnScroll>
  );
}

export function AIPlanSkeleton() {
  return (
    <div className="px-3.5 mb-4">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          padding: "0 4px",
        }}
      >
        <div
          className="k-skeleton"
          style={{ width: 120, height: 10, borderRadius: 4 }}
        />
        <div
          className="k-skeleton"
          style={{ width: 80, height: 10, borderRadius: 4 }}
        />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 14,
              display: "grid",
              gap: 6,
            }}
          >
            <div
              className="k-skeleton"
              style={{ width: "55%", height: 13, borderRadius: 4 }}
            />
            <div
              className="k-skeleton"
              style={{ width: "90%", height: 11, borderRadius: 4 }}
            />
            <div
              className="k-skeleton"
              style={{ width: "70%", height: 11, borderRadius: 4 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
