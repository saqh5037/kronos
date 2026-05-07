import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import type { DailyGreeting } from "@/server/actions/ai";

type ToneStyle = {
  accent: string;
  glow: string;
  label: string;
};

// Paleta brand v1 (manual de marca)
const TONE_STYLES: Record<DailyGreeting["tone"], ToneStyle> = {
  push: {
    accent: "var(--k-accent)",
    glow: "rgba(230, 0, 38, 0.32)",
    label: "PUSH",
  },
  maintain: {
    accent: "var(--brand-blue)",
    glow: "rgba(0, 68, 255, 0.28)",
    label: "MANTÉN",
  },
  recover: {
    accent: "var(--brand-cyan)",
    glow: "rgba(0, 191, 255, 0.28)",
    label: "RECOVERY",
  },
  comeback: {
    accent: "var(--brand-violet)",
    glow: "rgba(124, 58, 237, 0.30)",
    label: "VUELVE",
  },
  celebrate: {
    accent: "var(--brand-pink)",
    glow: "rgba(255, 77, 138, 0.32)",
    label: "PR",
  },
};

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
          className="relative overflow-hidden rounded-[16px] p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--k-line-2)",
            boxShadow: `0 0 0 1px ${style.glow}, 0 12px 36px ${style.glow}`,
          }}
        >
          {/* Top gradient accent bar — brand signature */}
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2.5px]"
            style={{ background: "var(--k-accent)" }}
          />
          {/* Soft gradient glow background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: "var(--k-accent-soft)",
              opacity: 0.5,
            }}
          />
          {/* Corner decorations */}
          <span className="k-corner-tl" aria-hidden />
          <span className="k-corner-br" aria-hidden />

          <div className="relative flex items-start gap-3.5">
            <div
              className="flex-shrink-0 h-10 w-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: "var(--k-accent)",
                boxShadow: `0 4px 16px ${style.glow}`,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-mono text-[10px] tracking-[0.22em] font-bold uppercase inline-flex items-center gap-2"
                  style={{ color: "var(--k-accent)" }}
                >
                  <span
                    className="inline-block h-[1.5px] w-5"
                    style={{ background: "var(--k-accent)" }}
                  />
                  Kronos AI
                </span>
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full"
                  style={{ background: "var(--k-t3)" }}
                />
                <span
                  className="font-mono text-[9px] tracking-[0.18em] font-bold uppercase"
                  style={{ color: style.accent }}
                >
                  {style.label}
                </span>
                {greeting.source === "fallback" && (
                  <span
                    title="Modo offline — texto local"
                    className="font-mono text-[8px] tracking-[0.16em] font-bold uppercase ml-1"
                    style={{ color: "var(--k-t3)" }}
                  >
                    · OFFLINE
                  </span>
                )}
              </div>
              <p
                className="font-display text-[16px] leading-[1.45] font-semibold"
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
