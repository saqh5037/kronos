"use client";

import { motion, useReducedMotion } from "framer-motion";
import HeroPhone from "./HeroPhone";
import DuotoneImage from "./DuotoneImage";
import { HERO_META } from "../_data/mock";
import { track } from "../_lib/track";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Hero({
  boxHref,
  dominusActive = false,
}: {
  boxHref: string | null;
  dominusActive?: boolean;
}) {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : stagger;
  const child = reduce ? undefined : item;
  const ownerHref = dominusActive ? "/founding-dominus" : "/signup";
  const ownerLabel = dominusActive
    ? "Tengo un box · Founding Dominus"
    : "Tengo un box · Trial 14 días";

  return (
    <section className="lp-hero" id="producto">
      <DuotoneImage
        src="/images/landing/box-hero-coach-tablet.webp"
        alt=""
        intensity="soft"
        position="center 35%"
        priority
        sizes="100vw"
      />
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <motion.div initial="hidden" animate="show" variants={variants}>
          <motion.div className="lp-eyebrow" variants={child}>
            <span className="lp-dot" />
            PILOTO PRIVADO · MÉXICO · CUPO LIMITADO
          </motion.div>
          <motion.h1 variants={child}>
            Software invisible
            <br />
            para tu CrossFit Box.
          </motion.h1>
          <motion.p className="lp-lead" variants={child}>
            Reservas, WODs, pagos, racha y admin en una sola app, en español,
            con tu logo y tu color. Diseñada para CrossFit en México.
          </motion.p>
          <motion.div className="lp-hero-actions" variants={child}>
            {boxHref ? (
              <a
                href={boxHref}
                className="lp-btn-lime lp-btn-lg"
                onClick={() =>
                  track("cta_clicked", { location: "hero_to_box" })
                }
              >
                Ir a mi box
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
            ) : (
              <>
                <a
                  href="/atleta-signup"
                  className="lp-btn-lime lp-btn-lg"
                  onClick={() =>
                    track("cta_clicked", {
                      location: "hero_split",
                      audience: "atleta",
                    })
                  }
                >
                  Soy atleta · Empezar gratis
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
                  href={ownerHref}
                  className="lp-btn-ghost lp-btn-lg"
                  onClick={() =>
                    track("cta_clicked", {
                      location: "hero_split",
                      audience: "owner",
                    })
                  }
                >
                  {ownerLabel}
                </a>
              </>
            )}
            {boxHref ? (
              <a
                href="#section-atleta"
                className="lp-btn-ghost lp-btn-lg"
                onClick={() =>
                  track("cta_clicked", { location: "hero_secondary" })
                }
              >
                Ver cómo funciona
              </a>
            ) : (
              <a
                href="#section-atleta"
                className="lp-link-tertiary"
                onClick={() =>
                  track("cta_clicked", { location: "hero_tertiary" })
                }
                style={{
                  fontSize: 13,
                  color: "var(--k-t3)",
                  textDecoration: "underline",
                  marginTop: 8,
                  display: "inline-block",
                }}
              >
                ¿Ver cómo funciona primero?
              </a>
            )}
          </motion.div>
          <motion.div className="lp-hero-meta" variants={child}>
            {HERO_META.strip}
          </motion.div>
        </motion.div>

        <HeroPhone />
      </div>
    </section>
  );
}
