"use client";

import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const SI = [
  "Trackear tus PRs y ver progresión real",
  "Reservar clase en tu box (si tu box usa Kronos)",
  "Foto del whiteboard → score auto-detectado",
  "Skills con coach IA y progresiones desbloqueables",
  "Comparar tu rendimiento contra el promedio del box",
  "Leerte tu propio histórico sin vender tus datos",
];

const NO = [
  "Reemplaza a tu coach humano (no genera planes, no corrige técnica)",
  "Es app de fitness genérica (no caminás, no contás macros, no hay yoga)",
  "Es red social (no hay feed de extraños, no hay influencers)",
  "Funciona sin tu box (en Box Personal cargás vos los WODs)",
  "Te da motivación falsa (cero «¡tú puedes!», cero emojis de fuego)",
  "Te vende a anunciantes (tu data no entrena modelos de terceros)",
];

export default function AtletaSiNo() {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="si-no">
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="lp-eyebrow"
          style={{ justifyContent: "center", display: "inline-flex" }}
        >
          <span className="lp-dot" />
          /03 · ESTO SÍ · ESTO NO
        </div>
        <h2 style={{ marginTop: 20, textAlign: "center" }}>
          Honestidad <span className="lp-tag-lime">antes que venta</span>.
        </h2>
        <p style={{ margin: "24px auto 0", textAlign: "center" }}>
          Listamos lo que no hacemos para que sepas si Kronos Atletas es para
          vos. Si lo que necesitás está en la columna derecha, hay otras apps
          mejores.
        </p>
      </div>

      <div
        className="atletas-sino-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={variants}
          className="lp-card-frame"
          style={{ minHeight: 0, padding: 36 }}
        >
          <div
            className="lp-caption"
            style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
          >
            <span className="lp-dot" style={{ marginRight: 10 }} />
            ESTO SÍ
          </div>
          <h3
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--k-t1)",
              margin: "16px 0 24px",
              lineHeight: 1.05,
            }}
          >
            Lo que la app hace.
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {SI.map((s) => (
              <li
                key={s}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--k-line)",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14.5,
                  color: "var(--k-t1)",
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2 }}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={variants}
          className="lp-card-frame"
          style={{
            minHeight: 0,
            padding: 36,
            background: "var(--k-bg)",
          }}
        >
          <div
            className="lp-caption"
            style={{ color: "var(--k-t3)", letterSpacing: "0.22em" }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--k-t3)",
                display: "inline-block",
                marginRight: 10,
              }}
            />
            ESTO NO
          </div>
          <h3
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--k-t2)",
              margin: "16px 0 24px",
              lineHeight: 1.05,
            }}
          >
            Lo que <em style={{ fontStyle: "italic" }}>no</em> hace.
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {NO.map((n) => (
              <li
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--k-line)",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14.5,
                  color: "var(--k-t2)",
                  lineHeight: 1.5,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-t3)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2 }}
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
