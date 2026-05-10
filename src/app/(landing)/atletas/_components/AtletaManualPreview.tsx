"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const PREVIEW = [
  {
    src: "/manual/atleta/home.png",
    alt: "Pantalla de inicio con racha, próxima clase y leaderboard del WOD",
    label: "INICIO",
    hint: "Tu próxima victoria",
    anchor: "#inicio",
  },
  {
    src: "/manual/atleta/skills.png",
    alt: "Pantalla de skills con catálogo de movimientos y coach virtual",
    label: "SKILLS",
    hint: "Coach virtual con IA",
    anchor: "#skills",
  },
  {
    src: "/manual/atleta/perfil.png",
    alt: "Pantalla de perfil con radar de capacidades, PRs y heatmap 90 días",
    label: "PERFIL",
    hint: "Datos duros, no decorativos",
    anchor: "#perfil",
  },
  {
    src: "/manual/atleta/logros.png",
    alt: "Pantalla de logros con badges desbloqueables y nivel atleta",
    label: "LOGROS",
    hint: "Skill tree real",
    anchor: "#logros",
  },
];

export default function AtletaManualPreview() {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="manual-preview">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div
          className="lp-eyebrow"
          style={{ justifyContent: "center", display: "inline-flex" }}
        >
          <span className="lp-dot" />
          /04 · MANUAL VISUAL
        </div>
        <h2 style={{ marginTop: 20, textAlign: "center" }}>
          Cada pantalla,
          <br />
          <span className="lp-tag-lime">paso a paso</span>.
        </h2>
        <p style={{ margin: "24px auto 0", textAlign: "center" }}>
          Documentación visual de cada pantalla con qué hace y qué podés
          ejecutar en cada una. Compartible por link directo a la sección.
        </p>
      </div>

      <div
        className="atletas-preview-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 18,
          marginBottom: 48,
        }}
      >
        {PREVIEW.map((p, i) => (
          <motion.div
            key={p.label}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={variants}
            transition={{ delay: i * 0.06 }}
          >
            <a
              href={`/atletas/manual${p.anchor}`}
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_preview_card",
                  screen: p.label,
                })
              }
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "9 / 19.5",
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#000",
                  border: "1px solid var(--k-line)",
                  boxShadow:
                    "0 24px 48px -16px rgba(0,0,0,0.6), 0 0 40px rgba(200,255,45,0.05)",
                  transition: "transform 0.22s ease, box-shadow 0.22s ease",
                }}
                className="atletas-preview-frame"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 22vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <div
                  className="lp-caption"
                  style={{
                    color: "var(--k-accent)",
                    letterSpacing: "0.22em",
                    fontSize: 10,
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 14,
                    color: "var(--k-t2)",
                    marginTop: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {p.hint}
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <a
          href="/atletas/manual"
          className="lp-btn-lime lp-btn-lg"
          style={{ display: "inline-flex" }}
          onClick={() =>
            track("cta_clicked", { location: "atletas_preview_cta_main" })
          }
        >
          Abrir el manual completo →
        </a>
        <p
          className="lp-caption"
          style={{
            color: "var(--k-t3)",
            marginTop: 18,
            letterSpacing: "0.18em",
          }}
        >
          9 PANTALLAS · QUÉ HACE · QUÉ PODÉS EJECUTAR
        </p>
      </div>
    </section>
  );
}
