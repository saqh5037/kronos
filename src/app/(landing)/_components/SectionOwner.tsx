"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { OWNER_KPIS, OWNER_OCCUPANCY } from "../_data/mock";
import { CTA_TRIAL_HREF, CTA_TRIAL_LABEL } from "../_data/cta";
import { track } from "../_lib/track";

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
      id="section-owner"
      style={{
        borderTop: "1px solid var(--k-line)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient backdrop — coach corrigiendo forma (B&W). Opacidad baja para
          que el frame admin y la columna de texto sigan siendo el foco. Mask
          radial hace fade hacia el centro donde está el contenido. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          maskImage:
            "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)",
        }}
      >
        <Image
          src="/images/landing/box-coach-correcting-form.webp"
          alt=""
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "right center",
            opacity: 0.18,
            filter: "grayscale(100%) contrast(1.05) brightness(0.6)",
          }}
        />
      </div>
      <m.div
        className="lp-section-grid"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.1 } } }
        }
        style={{ position: "relative", zIndex: 1 }}
      >
        <m.div className="lp-owner-frame lp-grain" variants={v}>
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
              PANEL DEL DUEÑO · VISTA DEL MES
            </div>
            <span className="lp-caption" style={{ color: "var(--k-t3)" }}>
              DATOS DE EJEMPLO
            </span>
          </div>

          <div className="lp-kpi-grid">
            {OWNER_KPIS.map((k) => (
              <div key={k.label} className="lp-kpi">
                <div className="l">{k.label}</div>
                <div className="v">{k.value}</div>
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
                PROMEDIO · 78 %
              </div>
            </div>
            <div className="lp-chart-bars">
              {OWNER_OCCUPANCY.map((bar, i) => (
                <m.div
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
        </m.div>

        <m.div variants={v}>
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            /02 · PARA EL DUEÑO DEL BOX
          </div>
          <h2>Tu operación, en cifras frías.</h2>
          <p>
            Un panel que tu contador respeta y tu coach principal abre cada
            mañana. Sin gráficos decorativos, sin métricas de adorno. Las cifras
            que dictan si el mes cierra en azul o en rojo, en una sola pantalla.
          </p>
          <ul className="lp-feature-list">
            <li>
              <div>
                <strong>
                  Cuánto entró, cuántos atletas activos y cuántos se fueron
                </strong>
                <span className="desc">
                  Ingresos del mes, atletas activos, bajas y quién no ha pagado,
                  en tiempo real. Sin armar Excel, sin pedirle al contador.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Ocupación por hora del día</strong>
                <span className="desc">
                  Sabes qué clase mover y qué horario pierde dinero. Decisiones
                  de programación basadas en data dura, no en la intuición del
                  coach.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Atletas en riesgo, antes de la baja</strong>
                <span className="desc">
                  Quién dejó de venir 14 días. Quién bajó intensidad. Quién
                  vence membresía esta semana. Lo ves antes de que se dé de baja,
                  no después.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Pagos sin perseguir a nadie</strong>
                <span className="desc">
                  Mercado Pago para tarjeta, y el efectivo registrado en el admin
                  para que ningún pago se pierda. Ves al corriente y al moroso en
                  la misma lista, sin tener que llamar.
                </span>
              </div>
            </li>
          </ul>
          <a
            href={CTA_TRIAL_HREF}
            className="lp-btn-ghost lp-btn-lg"
            onClick={() => track("cta_clicked", { location: "section_owner" })}
          >
            {CTA_TRIAL_LABEL}
          </a>
        </m.div>
      </m.div>
    </section>
  );
}
