import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import type { DailyGreeting } from "@/server/actions/ai";

type ToneStyle = {
  accent: string;
  glow: string;
  label: string;
};

const TONE_STYLES: Record<DailyGreeting["tone"], ToneStyle> = {
  push: {
    accent: "#dc4b17",
    glow: "rgba(220, 75, 23, 0.32)",
    label: "PUSH",
  },
  maintain: {
    accent: "#64748b",
    glow: "rgba(100, 116, 139, 0.28)",
    label: "MANTÉN",
  },
  recover: {
    accent: "#4a7c59",
    glow: "rgba(74, 124, 89, 0.28)",
    label: "RECOVERY",
  },
  comeback: {
    accent: "#d97706",
    glow: "rgba(217, 119, 6, 0.30)",
    label: "VUELVE",
  },
  celebrate: {
    accent: "#c44536",
    glow: "rgba(196, 69, 54, 0.32)",
    label: "PR",
  },
};

const AI_PRIMARY = "#ff2bd6";
const AI_SECONDARY = "#00e5ff";

export default function PersonalizedGreeting({
  greeting,
}: {
  greeting: DailyGreeting | null;
}) {
  if (!greeting) return null;
  const style = TONE_STYLES[greeting.tone];

  return (
    <section className="px-3.5 mt-3">
      <AnimatedItem>
        <div
          className="relative overflow-hidden rounded-[14px] p-3.5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--line-strong)",
            boxShadow: `0 0 0 1px ${style.glow}, 0 8px 28px ${style.glow}`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 0% 100%, ${AI_PRIMARY}1f 0%, transparent 50%), radial-gradient(circle at 100% 0%, ${AI_SECONDARY}1a 0%, transparent 55%)`,
            }}
          />
          <div className="relative flex items-start gap-3">
            <div
              className="flex-shrink-0 h-9 w-9 rounded-[10px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${AI_PRIMARY} 0%, ${AI_SECONDARY} 100%)`,
                boxShadow: `0 0 14px ${AI_PRIMARY}55`,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0a0f1f"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono text-[9px] tracking-[0.18em] font-bold uppercase"
                  style={{ color: AI_PRIMARY }}
                >
                  Kronos AI
                </span>
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full"
                  style={{ background: "var(--text-3)" }}
                />
                <span
                  className="font-mono text-[9px] tracking-[0.16em] font-bold uppercase"
                  style={{ color: style.accent }}
                >
                  {style.label}
                </span>
                {greeting.source === "fallback" && (
                  <span
                    title="Modo offline — texto local"
                    className="font-mono text-[8px] tracking-[0.16em] font-bold uppercase"
                    style={{ color: "var(--text-3)" }}
                  >
                    · OFFLINE
                  </span>
                )}
              </div>
              <p
                className="font-display text-[15px] leading-[1.45] font-semibold"
                style={{ color: "var(--text)" }}
              >
                {greeting.text}
              </p>
            </div>
          </div>
        </div>
      </AnimatedItem>
    </section>
  );
}
