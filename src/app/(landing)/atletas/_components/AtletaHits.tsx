"use client";

import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

type Hit = {
  num: string;
  title: string;
  body: string;
  detail: { label: string; value: string };
};

const HITS: Hit[] = [
  {
    num: "01",
    title: "Foto del pizarrón → PR automático",
    body: "Tomas foto del pizarrón al terminar el WOD. Kronos lee el nombre, los movimientos, tu marca. Si bajaste 34 segundos en Helen, lo sabes al instante — no porque el coach se acordó tres días después.",
    detail: { label: "ÚLTIMO HELEN", value: "−0:34" },
  },
  {
    num: "02",
    title: "Coach virtual con IA real",
    body: "Eliges el skill (snatch, muscle-up, pistol). Kronos calcula las progresiones que te tocan hoy según tu nivel, no según un PDF genérico. Las que ya pasaste se marcan, las bloqueadas te dicen por qué.",
    detail: { label: "PROGRESIÓN", value: "27%" },
  },
  {
    num: "03",
    title: "Racha + check-in + trofeo del mes",
    body: "La racha es el número más grande de la app. Check-in diario rápido: cómo te sientes. Trofeo del mes curado por IA. Retención de verdad, sin emojis de fuego.",
    detail: { label: "RACHA", value: "23 DÍAS" },
  },
  {
    num: "04",
    title: "Perfil con datos duros",
    body: "Radar de capacidades vs el promedio de tu box. Mapa de calor de 90 días. Timeline de scores normalizados. Si llevas 3 meses estancado en el mismo peso, lo ves.",
    detail: { label: "VENTANA", value: "90 DÍAS" },
  },
  {
    num: "05",
    title: "Logros que sí valen",
    body: "Cero estrellas decorativas. Badges con condiciones reales: «Primer muscle-up estricto», «Doble peso corporal en back squat», «Guerrero RX». Lo que desbloqueas te costó.",
    detail: { label: "NIVEL ATLETA", value: "07" },
  },
  {
    num: "06",
    title: "Reserva en 1 tap, lista FIFO",
    body: "Si tu box usa Kronos: CTA gigante en el color del box. Lista de espera con tu posición visible. Si alguien cancela, te llega push y se confirma sin que vuelvas a abrir.",
    detail: { label: "TIEMPO RESERVA", value: "1 TAP" },
  },
];

export default function AtletaHits() {
  const reduce = useReducedMotion();
  const variants = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section" id="hits">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div
          className="lp-eyebrow"
          style={{ justifyContent: "center", display: "inline-flex" }}
        >
          <span className="lp-dot" />
          /02 · LO QUE LA APP HACE BIEN
        </div>
        <h2 style={{ marginTop: 20, textAlign: "center" }}>
          Seis cosas que <span className="lp-tag-lime">cambian tu entreno</span>
          .
          <br />
          Sin marketing-speak.
        </h2>
      </div>

      <div
        className="atletas-hits-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 18,
        }}
      >
        {HITS.map((h, i) => (
          <motion.article
            key={h.num}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={variants}
            transition={{ delay: i * 0.04 }}
            className="lp-card-frame"
            style={{
              minHeight: 0,
              padding: 32,
              gap: 18,
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                borderBottom: "1px solid var(--k-line)",
                paddingBottom: 14,
              }}
            >
              <span
                className="lp-mono"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: "var(--k-t3)",
                }}
              >
                /{h.num}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  textAlign: "right",
                }}
              >
                <span
                  className="lp-caption"
                  style={{
                    color: "var(--k-t3)",
                    letterSpacing: "0.18em",
                    fontSize: 9.5,
                  }}
                >
                  {h.detail.label}
                </span>
                <span
                  className="lp-mono"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: "var(--k-accent)",
                  }}
                >
                  {h.detail.value}
                </span>
              </div>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--k-t1)",
                  margin: "0 0 14px",
                  lineHeight: 1.15,
                }}
              >
                {h.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14.5,
                  color: "var(--k-t2)",
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: "none",
                }}
              >
                {h.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
