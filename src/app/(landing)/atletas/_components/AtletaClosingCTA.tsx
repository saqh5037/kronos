"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";
import { FINAL_CTA, CTA_LABEL } from "../_data/copy";

export default function AtletaClosingCTA({
  boxHref,
}: {
  boxHref: string | null;
}) {
  const reduce = useReducedMotion();
  const primaryHref = boxHref ?? "/login";

  return (
    <section className="lp-cta-tail-shell">
      <motion.div
        className="lp-cta-tail lp-grain"
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          style={{ flex: 1, minWidth: 320, position: "relative", zIndex: 1 }}
        >
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            {FINAL_CTA.eyebrow}
          </div>
          <h2>
            {FINAL_CTA.h2Line1}
            <br />
            <span className="lp-tag-lime">{FINAL_CTA.h2Line2}</span>
          </h2>
          <p>{FINAL_CTA.sub}</p>
        </div>
        <div
          className="lp-cta-stack"
          style={{ position: "relative", zIndex: 1 }}
        >
          <a
            href={primaryHref}
            className="lp-btn-lime lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() =>
              track("cta_clicked", {
                location: boxHref
                  ? "atletas_closing_to_box"
                  : "atletas_closing_login",
              })
            }
          >
            {boxHref ? "Ir a mi box" : CTA_LABEL}
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
          <a
            href={FINAL_CTA.ctaSecondaryHref}
            className="lp-btn-ghost lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() =>
              track("cta_clicked", {
                location: "atletas_closing_referral",
              })
            }
          >
            {FINAL_CTA.ctaSecondaryLabel}
          </a>
          <span
            className="lp-caption"
            style={{
              color: "var(--k-t3)",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {FINAL_CTA.footnote}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
