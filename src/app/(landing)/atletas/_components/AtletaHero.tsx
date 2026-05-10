"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";

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

  return (
    <section className="lp-hero" id="producto">
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <motion.div initial="hidden" animate="show" variants={variants}>
          <motion.div className="lp-eyebrow" variants={child}>
            <span className="lp-dot" />
            KRONOS ATLETAS · GUÍA COMPLETA
          </motion.div>
          <motion.h1 variants={child}>
            Tu progreso
            <br />
            es <span className="lp-tag-lime">el producto</span>.
          </motion.h1>
          <motion.p className="lp-lead" variants={child}>
            La app del atleta de CrossFit que{" "}
            <strong>no se siente como app</strong>. Trackea PRs reales, lee tu
            whiteboard con la cámara, y entrena skills con un coach virtual que
            sabe en qué nivel estás. Sin notificaciones basura. Sin gamificación
            cringe. Sin influencers.
          </motion.p>
          <motion.div className="lp-hero-actions" variants={child}>
            <a
              href={boxHref ?? "/atleta-signup?from=atletas-landing"}
              className="lp-btn-lime lp-btn-lg"
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_hero_primary",
                  audience: "atleta",
                })
              }
            >
              {boxHref ? "Abrir mi app" : "Empezar gratis"}
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
              href="/atletas/manual"
              className="lp-btn-ghost lp-btn-lg"
              onClick={() =>
                track("cta_clicked", { location: "atletas_hero_manual" })
              }
            >
              Leer el manual completo →
            </a>
          </motion.div>
          <motion.div className="lp-hero-meta" variants={child}>
            <span>
              <strong>2 modos</strong> · BOX PERSONAL + ATLETA DE BOX
            </span>
            <span>
              <strong>9 pantallas</strong> · DOCUMENTADAS PASO A PASO
            </span>
            <span>
              <strong>0 anuncios</strong> · 0 INFLUENCERS · 0 CRINGE
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="lp-phone-wrap"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          <div className="lp-phone-glow" aria-hidden="true" />
          <div
            className="atletas-hero-phone"
            style={{
              position: "relative",
              borderRadius: 44,
              overflow: "hidden",
              boxShadow:
                "0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(200,255,45,0.08)",
              background: "#000",
              width: 320,
              maxWidth: "100%",
            }}
          >
            <Image
              src="/manual/atleta/home.png"
              alt="Pantalla de inicio de Kronos Atletas mostrando la racha, próxima clase y leaderboard del WOD del día"
              width={750}
              height={1624}
              priority
              sizes="(max-width: 720px) 280px, 320px"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
