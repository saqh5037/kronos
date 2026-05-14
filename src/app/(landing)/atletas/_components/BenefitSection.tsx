"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";
import PhoneFrame from "./PhoneFrame";
import { CTA_LABEL } from "../_data/copy";

const textVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const phoneVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut", delay: 0.15 },
  },
};

type Detail = { label: string; value: string };

export type BenefitSectionProps = {
  /** id usado como anchor (sin #) */
  anchor: string;
  eyebrow: string;
  h2: string;
  body: string;
  detail: Detail;
  phoneSrc: string;
  phoneAlt: string;
  /** layout flip: phone a la izquierda (default false → phone derecha) */
  flip?: boolean;
  /** location enviado a track() en el CTA */
  trackLocation: string;
  /** href del CTA primario — si hay sesión activa, override desde page */
  ctaHref: string;
};

export default function BenefitSection({
  anchor,
  eyebrow,
  h2,
  body,
  detail,
  phoneSrc,
  phoneAlt,
  flip = false,
  trackLocation,
  ctaHref,
}: BenefitSectionProps) {
  const reduce = useReducedMotion();
  const text = reduce ? undefined : textVariants;
  const phone = reduce ? undefined : phoneVariants;

  const Phone = (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={phone}
      style={{ display: "flex", justifyContent: "center" }}
    >
      <PhoneFrame src={phoneSrc} alt={phoneAlt} size="lg" glow width={300} />
    </motion.div>
  );

  const Text = (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={text}
    >
      <div
        className="lp-eyebrow"
        style={{
          color: "var(--k-accent)",
          letterSpacing: "0.22em",
        }}
      >
        <span className="lp-dot" />
        {eyebrow}
      </div>
      <h2
        style={{
          marginTop: 20,
          marginBottom: 20,
          textAlign: "left",
        }}
      >
        {h2}
      </h2>
      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 16,
          color: "var(--k-t2)",
          lineHeight: 1.6,
          margin: "0 0 28px",
          maxWidth: 520,
        }}
      >
        {body}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          paddingTop: 16,
          paddingBottom: 28,
          borderTop: "1px solid var(--k-line)",
        }}
      >
        <span
          className="lp-caption"
          style={{
            color: "var(--k-t3)",
            letterSpacing: "0.22em",
            fontSize: 10,
          }}
        >
          {detail.label}
        </span>
        <span
          className="lp-mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--k-accent)",
          }}
        >
          {detail.value}
        </span>
      </div>

      <a
        href={ctaHref}
        className="lp-btn-lime lp-btn-lg"
        onClick={() => track("cta_clicked", { location: trackLocation })}
      >
        {CTA_LABEL}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </motion.div>
  );

  return (
    <section
      className="lp-section"
      id={anchor}
      style={{ paddingTop: 80, paddingBottom: 80 }}
    >
      <div
        className="atletas-benefit-grid"
        style={{
          display: "grid",
          gridTemplateColumns: flip ? "auto 1fr" : "1fr auto",
          gap: 64,
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {flip ? Phone : Text}
        {flip ? Text : Phone}
      </div>
    </section>
  );
}
