"use client";

import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function SectionAtleta() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="section-atleta">
      <motion.div
        className="lp-section-grid lp-flip"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.1 } } }
        }
      >
        <motion.div variants={v}>
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            /01 · PARA EL ATLETA
          </div>
          <h2>La app que no se siente como app.</h2>
          <p>
            Sin notificaciones basura. Sin gamificación cringe. Sin el logo de
            un proveedor extranjero ocupando la pantalla del atleta. Una
            interfaz con lo único que importa: el WOD de hoy, la próxima clase,
            y la racha que está construyendo.
          </p>
          <ul className="lp-feature-list">
            <li>
              <div>
                <strong>23 días de racha</strong>
                <span className="desc">
                  El número más grande de la app. Si lo rompe, lo ve antes que
                  nada. Si lo extiende, lo siente todo el día. Retención
                  psicológica pura, sin push notifications motivacionales.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Helen · 11:42 (su PR)</strong>
                <span className="desc">
                  El WOD del día contra la mejor marca histórica del atleta.
                  Compite contra sí mismo, no contra el feed de extraños. PR
                  detection automático sobre RX y scaled.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Reserva en 1 tap, no en 4 menús</strong>
                <span className="desc">
                  CTA primario de 54px en el color exacto del Box. Carga
                  instantánea (PWA con SSR). Cero ambigüedad al confirmar
                  asistencia.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Tu Box, no nosotros</strong>
                <span className="desc">
                  Logo, nombre, color, dominio: todo del Box. Operamos detrás
                  como infraestructura nativa. El ecosistema le pertenece a tu
                  marca.
                </span>
              </div>
            </li>
          </ul>
        </motion.div>

        <motion.div className="lp-card-frame lp-grain" variants={v}>
          <div className="lp-caption" style={{ color: "var(--k-accent)" }}>
            <span className="lp-dot" style={{ marginRight: 10 }} />
            PREVIEW · MULTI-TENANT CROSS-BOX
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              padding: "32px 0 16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                className="lp-caption"
                style={{ color: "var(--k-t3)", letterSpacing: "0.18em" }}
              >
                BENCHMARK · HOY
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--k-t1)",
                }}
              >
                HELEN · 3 RFT
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                padding: "20px 0",
                borderTop: "1px solid var(--k-line)",
                borderBottom: "1px solid var(--k-line)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  className="lp-caption"
                  style={{ color: "var(--k-t3)", letterSpacing: "0.18em" }}
                >
                  ANTERIOR
                </span>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 36,
                    fontWeight: 600,
                    color: "var(--k-t2)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  12:16
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  className="lp-caption"
                  style={{ color: "var(--k-accent)", letterSpacing: "0.18em" }}
                >
                  NUEVO PR
                </span>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 36,
                    fontWeight: 700,
                    color: "var(--k-accent)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  11:42
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--k-accent-soft, rgba(200,255,45,0.08))",
                border: "1px solid var(--k-accent-line, rgba(200,255,45,0.3))",
                borderRadius: 8,
              }}
            >
              <span
                className="lp-mono"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--k-accent)",
                  letterSpacing: "-0.01em",
                }}
              >
                −0:34
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 13,
                  color: "var(--k-t2)",
                  lineHeight: 1.4,
                }}
              >
                Mejora detectada vs tu mejor marca. Registrado en histórico.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "auto",
              paddingTop: 20,
              borderTop: "1px dashed var(--k-line)",
              alignItems: "center",
            }}
          >
            <span className="lp-caption" style={{ color: "var(--k-t3)" }}>
              RACHA UNIFICADA · 23 DÍAS · 3 BOXES · 0 FRICCIONES
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
