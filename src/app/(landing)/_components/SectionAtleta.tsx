"use client";

import { m, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function SectionAtleta() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="section-atleta">
      <m.div
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
        <m.div variants={v}>
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
                <strong>
                  Reserva en 1 tap, lista de espera con tu lugar real
                </strong>
                <span className="desc">
                  CTA primario gigante en el color del Box. Si la clase está
                  llena, lista de espera FIFO con tu posición visible. Cuando
                  alguien cancela, te entra push instantáneo y se confirma sin
                  que tengas que volver a entrar.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Recordatorio inteligente, no spam motivacional</strong>
                <span className="desc">
                  Push 2 horas antes de tu clase confirmada. Si tienes que
                  cancelar, un tap. Sin guilt-tripping, sin emojis de fuego, sin
                  frases tipo &ldquo;¡tú puedes campeón!&rdquo;.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>WOD del día con video por movimiento</strong>
                <span className="desc">
                  Cada movimiento del WOD lleva su video de técnica curado.
                  Snatch, muscle-up, kipping pull-up, clean &amp; jerk: el
                  atleta entra al box ya con la imagen del patrón en la cabeza,
                  no preguntándole al coach a media clase.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Tu marca, contra ti mismo (auto-PR)</strong>
                <span className="desc">
                  Helen 11:42 vs tu mejor de 12:16 → el sistema lo detecta, lo
                  registra y te lo dice en el momento. RX, scaled y
                  modificaciones por separado. Compites contra ti, no contra el
                  feed de extraños.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Histórico por movimiento, no por día</strong>
                <span className="desc">
                  Tu Fran de hoy contra los últimos 6 meses. Tu back squat 1RM
                  contra el del año pasado. Gráfica simple, datos duros, sin
                  charts decorativos. Ves si estás mejorando o si llevas 3 meses
                  estancado en el mismo peso.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>23 días de racha — el número que importa</strong>
                <span className="desc">
                  El contador de racha es el número más grande de la app. Si lo
                  rompes, lo ves antes que nada. Si lo extiendes, lo sientes
                  todo el día. Retención psicológica pura, sin push
                  notifications motivacionales.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Tu Box al frente (Titanio = sin Kronos)</strong>
                <span className="desc">
                  En Titanio, logo, nombre, color y dominio son del Box. Kronos
                  opera detrás como infraestructura nativa. En Hierro y Acero tu
                  marca es la dominante; Kronos aparece solo en el footer.
                </span>
              </div>
            </li>
          </ul>

          <a
            href="/atletas"
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              fontFamily: "var(--k-font-display), monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--k-accent)",
              borderBottom:
                "1px solid var(--k-accent-line, rgba(200,255,45,0.3))",
              paddingBottom: 4,
            }}
          >
            Guía completa de Kronos Atletas →
          </a>
        </m.div>

        <m.div className="lp-card-frame lp-grain" variants={v}>
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
        </m.div>
      </m.div>
    </section>
  );
}
