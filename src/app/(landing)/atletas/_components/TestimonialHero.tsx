"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TESTIMONIAL_HERO } from "../_data/copy";

const quoteVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

const attributionVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.35 },
  },
};

export default function TestimonialHero() {
  const reduce = useReducedMotion();
  const q = reduce ? undefined : quoteVariants;
  const a = reduce ? undefined : attributionVariants;

  return (
    <section
      className="lp-section lp-grain"
      style={{
        paddingTop: 96,
        paddingBottom: 96,
        position: "relative",
        borderTop: "1px solid var(--k-line)",
        borderBottom: "1px solid var(--k-line)",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          textAlign: "center",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <div
          className="lp-eyebrow"
          style={{
            justifyContent: "center",
            display: "inline-flex",
            color: "var(--k-t3)",
          }}
        >
          <span className="lp-dot" />
          {TESTIMONIAL_HERO.eyebrow}
        </div>

        <motion.blockquote
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={q}
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(28px, 4.2vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            color: "var(--k-t1)",
            margin: "32px 0 28px",
            padding: 0,
          }}
        >
          <span aria-hidden="true" style={{ color: "var(--k-accent)" }}>
            “
          </span>
          {TESTIMONIAL_HERO.quote}
          <span aria-hidden="true" style={{ color: "var(--k-accent)" }}>
            ”
          </span>
        </motion.blockquote>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={a}
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
          }}
        >
          — {TESTIMONIAL_HERO.attribution}
        </motion.div>
      </div>
    </section>
  );
}
