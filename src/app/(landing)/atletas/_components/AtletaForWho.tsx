"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const PERSONAL_FEATURES = [
  "Foto del pizarrón → OCR detecta el WOD",
  "Coach virtual con IA que arma tus progresiones",
  "Tu histórico de PRs por movimiento",
  "Perfil con radar, mapa de calor de 90 días, timeline",
  "Logros desbloqueables (badges + niveles + XP)",
];

const BOX_FEATURES = [
  "Reservar clase en 1 tap, lista de espera con tu lugar real",
  "WOD del día con video por movimiento",
  "Auto-PR contra tu propio histórico",
  "Leaderboard del box, escalas RX/scaled separadas",
  "Racha de asistencia que sí cuenta",
];

function TrackCardShell({
  badge,
  title,
  desc,
  features,
  cta,
  delay,
}: {
  badge: string;
  title: string;
  desc: string;
  features: string[];
  cta: React.ReactNode;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ delay }}
      className="lp-card-frame"
      style={{
        minHeight: 0,
        padding: 36,
        gap: 20,
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          className="lp-caption"
          style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
        >
          <span className="lp-dot" style={{ marginRight: 10 }} />
          {badge}
        </div>
        <h3
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "16px 0 14px",
            lineHeight: 1.05,
          }}
        >
          {title}.
        </h3>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 15,
            color: "var(--k-t2)",
            lineHeight: 1.55,
            margin: "0 0 24px",
          }}
        >
          {desc}
        </p>
        <ul className="lp-feature-list" style={{ margin: 0, maxWidth: "none" }}>
          {features.map((f) => (
            <li key={f}>
              <div>
                <strong style={{ fontWeight: 500 }}>{f}</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {cta}
    </motion.div>
  );
}

export default function AtletaForWho() {
  return (
    <section className="lp-section" id="for-who">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div
          className="lp-eyebrow"
          style={{ justifyContent: "center", display: "inline-flex" }}
        >
          <span className="lp-dot" />
          /01 · PARA QUIÉN ES
        </div>
        <h2 style={{ marginTop: 20, textAlign: "center" }}>
          Dos formas de entrenar
          <br />
          con <span className="lp-tag-lime">Kronos</span>.
        </h2>
        <p style={{ margin: "24px auto 0", textAlign: "center" }}>
          No hay tier &laquo;mejor&raquo;. Entrenas solo o vas a tu box — elige
          tu modo, Kronos se acomoda.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
        className="atletas-forwho-grid"
      >
        <TrackCardShell
          badge="BOX PERSONAL"
          title="Si entrenas solo"
          desc="Garage, parque, o box que no usa Kronos. Tú cargas los WODs, Kronos hace todo lo demás."
          features={PERSONAL_FEATURES}
          delay={0}
          cta={
            <Link
              href={{
                pathname: "/atleta-signup",
                query: { from: "personal" },
              }}
              className="lp-btn-lime lp-btn-lg"
              style={{ alignSelf: "flex-start", marginTop: 8 }}
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_forwho_personal",
                })
              }
            >
              Empezar gratis
            </Link>
          }
        />
        <TrackCardShell
          badge="ATLETA DE BOX"
          title="Si tienes tu box"
          desc="Tu box ya usa Kronos (o quieres que lo use). Tu coach programa, tú entrenas."
          features={BOX_FEATURES}
          delay={0.08}
          cta={
            <Link
              href={{
                pathname: "/",
                query: { audience: "athlete-referral" },
                hash: "section-form",
              }}
              className="lp-btn-ghost lp-btn-lg"
              style={{ alignSelf: "flex-start", marginTop: 8 }}
              onClick={() =>
                track("cta_clicked", { location: "atletas_forwho_box" })
              }
            >
              Pídele Kronos a tu coach →
            </Link>
          }
        />
      </div>
    </section>
  );
}
