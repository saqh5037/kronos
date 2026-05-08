"use client";

import { motion, useReducedMotion } from "framer-motion";
import { OWNER_KPIS, OWNER_OCCUPANCY } from "../_data/mock";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const DAYS = [
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
  "D",
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
  "D",
];

export default function SectionOwner() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section
      className="lp-section"
      id="owner"
      style={{ borderTop: "1px solid var(--k-line)" }}
    >
      <motion.div
        className="lp-section-grid"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.1 } } }
        }
      >
        <motion.div className="lp-owner-frame lp-grain" variants={v}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 16,
              borderBottom: "1px solid var(--k-line)",
            }}
          >
            <div className="lp-caption" style={{ color: "var(--k-accent)" }}>
              <span className="lp-dot" style={{ marginRight: 10 }} />
              ADMIN · TU BOX · ESTE MES
            </div>
            <span className="lp-caption" style={{ color: "var(--k-t3)" }}>
              v1.0
            </span>
          </div>

          <div className="lp-kpi-grid">
            {OWNER_KPIS.map((k) => (
              <div key={k.label} className="lp-kpi">
                <div className="l">{k.label}</div>
                <div className="v">
                  {k.value}
                  {k.pct ? <span className="pct">{k.pct}</span> : null}
                </div>
                <div className={`delta${k.up ? " up" : ""}`}>{k.delta}</div>
              </div>
            ))}
          </div>

          <div className="lp-chart-shell">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="lp-caption" style={{ color: "var(--k-t1)" }}>
                OCUPACIÓN · ÚLTIMOS 14 DÍAS
              </div>
              <div className="lp-caption" style={{ color: "var(--k-t3)" }}>
                PROMEDIO · 78%
              </div>
            </div>
            <div className="lp-chart-bars">
              {OWNER_OCCUPANCY.map((bar, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.4 + i * 0.04,
                    ease: "easeOut",
                  }}
                  style={{
                    background: bar.weekend
                      ? "var(--k-line)"
                      : "var(--k-accent)",
                    height: `${bar.value}%`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
            <div className="lp-chart-axis">
              {DAYS.map((d, i) => (
                <span
                  key={i}
                  className="lp-caption"
                  style={{ color: "var(--k-t3)" }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={v}>
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            /02 · PARA EL OWNER
          </div>
          <h2>
            Tu Box, <span className="lp-tag-lime">en cifras frías</span>.
          </h2>
          <p>
            Un panel que tu CFO entiende y tu coach principal abre cada mañana.
            Sin gráficos decorativos, sin métricas de vanity.{" "}
            <strong>Las cifras que mueven dinero</strong>, en una sola pantalla.
          </p>
          <ul className="lp-feature-list">
            <li>
              <div>
                <strong>MRR, churn, CAC, LTV</strong>
                <span className="desc">
                  Las 4 métricas que importan, listas para tu junta mensual. Sin
                  armar Excel, sin pedirle al contador.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Ocupación por hora del día</strong>
                <span className="desc">
                  Sabés qué clase mover y qué coach reforzar. Decisiones de
                  programación basadas en data, no en intuición.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Atletas en riesgo, antes que se vayan</strong>
                <span className="desc">
                  Quién dejó de venir 14 días. Quién bajó intensidad. Quién
                  vence membresía esta semana. Acción antes del churn.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Pagos sin perseguir</strong>
                <span className="desc">
                  Stripe, Mercado Pago, OXXO, transferencia. Recordatorios
                  automáticos. Reportes de cobranza sin abrir Excel.
                </span>
              </div>
            </li>
          </ul>
          <a href="#pricing" className="lp-btn-ghost lp-btn-lg">
            Ver el admin completo →
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
