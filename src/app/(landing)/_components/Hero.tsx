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

export default function Hero({ boxHref }: { boxHref: string | null }) {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : stagger;
  const child = reduce ? undefined : item;

  return (
    <section className="lp-hero" id="producto">
      <DuotoneImage
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80"
        alt=""
        intensity="ambient"
        position="center 30%"
        priority
        sizes="100vw"
      />
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <motion.div initial="hidden" animate="show" variants={variants}>
          <motion.div className="lp-eyebrow" variants={child}>
            <span className="lp-dot" />
            PILOTO PRIVADO · CDMX · CUPO LIMITADO
          </motion.div>
          <motion.h1 variants={child}>
            Tu Box arriba.
            <br />
            Nuestro motor abajo.
          </motion.h1>
          <motion.p className="lp-lead" variants={child}>
            Software invisible para CrossFit Boxes. Reservas, WODs, pagos, racha
            y admin en una app que vive en tu dominio, con tu logo y tu color.
            El atleta nunca lee Kronos en pantalla.
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
              <a
                href="#section-form"
                className="lp-btn-lime lp-btn-lg"
                onClick={() => track("cta_clicked", { location: "hero" })}
              >
                Reservar mi lugar
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
            )}
            <a
              href="#section-atleta"
              className="lp-btn-ghost lp-btn-lg"
              onClick={() =>
                track("cta_clicked", { location: "hero_secondary" })
              }
            >
              Ver cómo funciona
            </a>
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
