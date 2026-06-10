"use client";

import { m, useReducedMotion } from "framer-motion";
import { WHY } from "../_data/copy";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AtletaSiNo() {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="por-que">
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="lp-eyebrow"
          style={{ justifyContent: "center", display: "inline-flex" }}
        >
          <span className="lp-dot" />
          {WHY.eyebrow}
        </div>
        <h2 style={{ marginTop: 20, textAlign: "center" }}>
          {WHY.h2Line1} <span className="lp-tag-lime">{WHY.h2Line2}</span>
        </h2>
        <p style={{ margin: "24px auto 0", textAlign: "center" }}>{WHY.sub}</p>
      </div>

      <div
        className="atletas-sino-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={variants}
          className="lp-card-frame"
          style={{ minHeight: 0, padding: 36 }}
        >
          <div
            className="lp-caption"
            style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
          >
            <span className="lp-dot" style={{ marginRight: 10 }} />
            ESTO SÍ
          </div>
          <h3
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--k-t1)",
              margin: "16px 0 24px",
              lineHeight: 1.05,
            }}
          >
            {WHY.yesTitle}
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {WHY.yesItems.map((s) => (
              <li
                key={s}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--k-line)",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14.5,
                  color: "var(--k-t1)",
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2 }}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </m.div>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={variants}
          className="lp-card-frame"
          style={{
            minHeight: 0,
            padding: 36,
            background: "var(--k-bg)",
          }}
        >
          <div
            className="lp-caption"
            style={{ color: "var(--k-t3)", letterSpacing: "0.22em" }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--k-t3)",
                display: "inline-block",
                marginRight: 10,
              }}
            />
            ESTO NO
          </div>
          <h3
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--k-t2)",
              margin: "16px 0 24px",
              lineHeight: 1.05,
            }}
          >
            {WHY.noTitle}
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {WHY.noItems.map((n) => (
              <li
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--k-line)",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14.5,
                  color: "var(--k-t2)",
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-t3)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2 }}
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </m.div>
      </div>
    </section>
  );
}
