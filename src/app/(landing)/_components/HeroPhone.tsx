"use client";

import { m, useReducedMotion } from "framer-motion";

const STREAK_DAYS = 14;
// 14 cells: first 5 muted (warm-up), rest active. Visual weight on the lima fill.
const STREAK_PATTERN = [
  "muted",
  "muted",
  "muted",
  "muted",
  "off",
  "muted",
  "muted",
  "muted",
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
] as const;

export default function HeroPhone() {
  const reduceMotion = useReducedMotion();
  const float = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div className="lp-phone-wrap">
      <div className="lp-phone-glow" aria-hidden="true" />
      <m.div
        className="lp-phone lp-grain"
        initial={reduceMotion ? false : { y: 18 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        {...(float as object)}
      >
        <div className="lp-phone-island" />
        <div className="lp-phone-status">
          <span>9:41</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="16" height="11" viewBox="0 0 17 11" aria-hidden="true">
              <rect x="0" y="7" width="3" height="4" rx="0.5" fill="#fff" />
              <rect x="4" y="5" width="3" height="6" rx="0.5" fill="#fff" />
              <rect x="8" y="3" width="3" height="8" rx="0.5" fill="#fff" />
              <rect x="12" y="0" width="3" height="11" rx="0.5" fill="#fff" />
            </svg>
            <svg width="24" height="11" viewBox="0 0 25 12" aria-hidden="true">
              <rect
                x="0.5"
                y="0.5"
                width="21"
                height="11"
                rx="3"
                stroke="#fff"
                strokeOpacity="0.4"
                fill="none"
              />
              <rect x="2" y="2" width="18" height="8" rx="1.5" fill="#fff" />
            </svg>
          </span>
        </div>
        <div className="lp-phone-inner">
          <div className="lp-ph-header">
            <div className="lp-ph-brand">
              <div className="ih">B</div>
              <div className="ih-text">
                <span className="n">TU BOX</span>
                <span className="s">CROSSFIT · TU CIUDAD</span>
              </div>
            </div>
            <div className="lp-ph-avatar">A</div>
          </div>

          <div className="lp-ph-hero lp-grain">
            <div className="lp-ph-eyebrow-row">
              <span className="lp-dot" />
              <span className="lp-ph-eyebrow-text">RACHA · ACTIVA</span>
            </div>
            <div className="lp-ph-baseline">
              <span className="lp-ph-num">23</span>
              <span className="lp-ph-unit">DÍAS</span>
            </div>
            <div className="lp-ph-grid">
              {Array.from({ length: STREAK_DAYS }).map((_, i) => {
                const cell = STREAK_PATTERN[i] ?? "active";
                const bg =
                  cell === "active"
                    ? "var(--k-accent)"
                    : cell === "muted"
                      ? "var(--k-line-2)"
                      : "var(--k-line)";
                return <div key={i} style={{ background: bg }} />;
              })}
            </div>
            <div className="lp-ph-foot">
              <span>Mejor racha personal</span>
              <span className="pr">31 días</span>
            </div>
          </div>

          <div className="lp-ph-stats">
            <div className="lp-ph-stat">
              <div className="v">4</div>
              <div className="l">ASISTENCIAS</div>
            </div>
            <div
              className="lp-ph-stat"
              style={{
                borderColor: "var(--k-accent-line, rgba(200,255,45,0.3))",
              }}
            >
              <div className="v" style={{ color: "var(--k-accent)" }}>
                +12<span className="u">LBS</span>
              </div>
              <div className="l">PR · BACK SQ</div>
            </div>
            <div className="lp-ph-stat">
              <div className="v">
                85<span className="u">%</span>
              </div>
              <div className="l">ATTN</div>
            </div>
          </div>

          <div className="lp-ph-wod">
            <div className="row">
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 8.5,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  color: "var(--k-t3)",
                }}
              >
                WOD · HOY
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 8.5,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  color: "var(--k-accent)",
                }}
              >
                BENCHMARK
              </span>
            </div>
            <div className="name">HELEN</div>
            <div className="lines">
              <div>
                <span className="a" style={{ color: "var(--k-accent)" }}>
                  3 RFT
                </span>
              </div>
              <div>
                <span className="a">400 m</span>
                <span className="b">RUN</span>
              </div>
              <div>
                <span className="a">21 KB</span>
                <span className="b">SWING · 53/35 LB</span>
              </div>
              <div>
                <span className="a">12</span>
                <span className="b">PULL-UPS</span>
              </div>
            </div>
          </div>

          <div className="lp-ph-cta">
            <button type="button">RESERVAR PRÓXIMA →</button>
          </div>

          <div className="lp-ph-tabs">
            <div className="lp-ph-tab active">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
              </svg>
              <span className="lbl">HOME</span>
            </div>
            <div className="lp-ph-tab">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" />
                <path d="M3 9h18M8 3v4M16 3v4" />
              </svg>
              <span className="lbl">RESERVAR</span>
            </div>
            <div className="lp-ph-tab">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M13 3 4 14h7l-1 7 9-11h-7z" />
              </svg>
              <span className="lbl">WOD</span>
            </div>
            <div className="lp-ph-tab">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
              <span className="lbl">PERFIL</span>
            </div>
          </div>
        </div>
      </m.div>

      <div
        className="lp-phone-anno"
        style={{
          right: -12,
          top: 80,
          transform: "translateX(100%)",
          color: "var(--k-accent)",
        }}
      >
        <span className="rule" />
        <span>WHITE-LABEL · TU MARCA</span>
      </div>
      <div
        className="lp-phone-anno"
        style={{
          left: -12,
          top: 280,
          transform: "translateX(-100%)",
          color: "var(--k-t3)",
        }}
      >
        <span>HERO RACHA · 23 DÍAS</span>
        <span className="rule" />
      </div>
    </div>
  );
}
