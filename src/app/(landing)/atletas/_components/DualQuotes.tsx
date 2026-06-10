"use client";

import { m, useReducedMotion } from "framer-motion";
import { DUAL_QUOTES } from "../_data/copy";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

type Quote = { quote: string; attribution: string };

function QuoteCard({ q, delay }: { q: Quote; delay: number }) {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <m.figure
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={variants}
      transition={{ delay }}
      className="lp-card-frame"
      style={{
        minHeight: 0,
        padding: 32,
        margin: 0,
        gap: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <blockquote
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          lineHeight: 1.35,
          color: "var(--k-t1)",
          margin: 0,
          padding: 0,
        }}
      >
        <span aria-hidden="true" style={{ color: "var(--k-accent)" }}>
          “
        </span>
        {q.quote}
        <span aria-hidden="true" style={{ color: "var(--k-accent)" }}>
          ”
        </span>
      </blockquote>
      <figcaption
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          paddingTop: 16,
          borderTop: "1px solid var(--k-line)",
        }}
      >
        — <cite style={{ fontStyle: "normal" }}>{q.attribution}</cite>
      </figcaption>
    </m.figure>
  );
}

export default function DualQuotes() {
  return (
    <section className="lp-section" id="reseñas">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          className="lp-eyebrow"
          style={{
            justifyContent: "center",
            display: "inline-flex",
            color: "var(--k-t3)",
          }}
        >
          <span className="lp-dot" />
          {DUAL_QUOTES.eyebrow}
        </div>
      </div>

      <div
        className="atletas-dualquotes-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <QuoteCard q={DUAL_QUOTES.a} delay={0} />
        <QuoteCard q={DUAL_QUOTES.b} delay={0.08} />
      </div>
    </section>
  );
}
