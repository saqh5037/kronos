"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type Movement = {
  src: string;
  alt: string;
  label: string;
  category: "SKILL" | "WOD";
};

const MOVEMENTS: Movement[] = [
  {
    src: "/images/landing/atletas-skills-handstand.webp",
    alt: "Atleta en handstand sobre carretera con montañas al fondo",
    label: "Handstand",
    category: "SKILL",
  },
  {
    src: "/images/landing/atletas-skills-muscleup.webp",
    alt: "Atleta haciendo muscle-up en barra",
    label: "Muscle-up",
    category: "SKILL",
  },
  {
    src: "/images/landing/atletas-skills-rope.webp",
    alt: "Atleta trepando soga",
    label: "Rope climb",
    category: "SKILL",
  },
  {
    src: "/images/landing/atletas-wod-barbell.webp",
    alt: "Atleta haciendo deadlift con barra Eleiko",
    label: "Barbell",
    category: "WOD",
  },
  {
    src: "/images/landing/atletas-wod-kettlebell.webp",
    alt: "Atleta haciendo swing de kettlebell",
    label: "Kettlebell",
    category: "WOD",
  },
  {
    src: "/images/landing/atletas-wod-rower.webp",
    alt: "Atleta entrenando en remo",
    label: "Rower",
    category: "WOD",
  },
];

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function MovementStrip() {
  const reduce = useReducedMotion();
  const cardVariants = reduce ? undefined : card;
  const gridVariants = reduce ? undefined : grid;

  return (
    <section
      className="lp-section"
      id="movements"
      style={{ paddingTop: 80, paddingBottom: 80 }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          className="lp-eyebrow"
          style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
        >
          <span className="lp-dot" />
          Skills + WOD
        </div>
        <h2 style={{ marginTop: 20, marginBottom: 20, textAlign: "left" }}>
          Lo que entrenas con Kronos
        </h2>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 16,
            color: "var(--k-t2)",
            lineHeight: 1.6,
            margin: "0 0 40px",
            maxWidth: 620,
          }}
        >
          Desde gimnásticos hasta levantamientos pesados. Tu plan adapta
          progresiones para cada movimiento según tu nivel real.
        </p>

        <motion.div
          className="atletas-movement-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={gridVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {MOVEMENTS.map((mov) => (
            <motion.figure
              key={mov.label}
              variants={cardVariants}
              style={{
                position: "relative",
                margin: 0,
                aspectRatio: "1 / 1",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--k-line)",
                background: "var(--k-surface)",
              }}
            >
              <Image
                src={mov.src}
                alt={mov.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 280px"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
              {/* Gradient bottom overlay para legibilidad del label */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(8,8,10,0.85) 100%)",
                  pointerEvents: "none",
                }}
              />
              <figcaption
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 12,
                  right: 14,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  className="lp-mono"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--k-t1)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {mov.label}
                </span>
                <span
                  className="lp-caption"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    color: "var(--k-accent)",
                    fontWeight: 700,
                  }}
                >
                  {mov.category}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
