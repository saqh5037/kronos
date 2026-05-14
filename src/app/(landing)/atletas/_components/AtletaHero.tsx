"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";
import PhoneFrame from "./PhoneFrame";
import { HERO, CTA_LABEL } from "../_data/copy";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AtletaHero({ boxHref }: { boxHref: string | null }) {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : stagger;
  const child = reduce ? undefined : item;

  const ctaHref = boxHref ?? "/login";

  return (
    <section className="lp-hero" id="producto">
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <motion.div initial="hidden" animate="show" variants={variants}>
          <motion.div className="lp-eyebrow" variants={child}>
            <span className="lp-dot" />
            {HERO.eyebrow}
          </motion.div>
          <motion.h1 variants={child}>
            {HERO.claimLineA}
            <br />
            <span className="lp-tag-lime">{HERO.claimLineB}</span>
          </motion.h1>
          <motion.p className="lp-lead" variants={child}>
            {HERO.sub}
          </motion.p>
          <motion.div className="lp-hero-actions" variants={child}>
            <a
              href={ctaHref}
              className="lp-btn-lime lp-btn-lg"
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_hero_primary",
                  audience: "atleta",
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
          </motion.div>
          {!boxHref && (
            <motion.p
              variants={child}
              style={{
                marginTop: 16,
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                color: "var(--k-t3)",
              }}
            >
              {HERO.ctaTertiary}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="lp-phone-wrap"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <PhoneFrame
            src="/manual/atleta/home.png"
            alt="Pantalla de inicio de Kronos Atletas mostrando la racha, próxima clase y leaderboard del WOD del día"
            size="lg"
            priority
            glow
            width={320}
          />
        </motion.div>
      </div>
    </section>
  );
}
