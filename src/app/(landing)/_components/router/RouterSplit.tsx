"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import KronosLogo from "@/components/brand/KronosLogo";
import { track } from "../../_lib/track";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

type CardProps = {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: "/atletas" | "/box";
  trackLocation: string;
};

const MotionLink = motion(Link);

function RouteCard({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  trackLocation,
}: CardProps) {
  return (
    <MotionLink
      variants={cardItem}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      href={ctaHref}
      onClick={() => track("cta_clicked", { location: trackLocation })}
      className="lp-card-frame router-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: 36,
        minHeight: 0,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className="lp-eyebrow"
        style={{
          color: "var(--k-accent)",
          letterSpacing: "0.22em",
        }}
      >
        <span className="lp-dot" />
        {eyebrow}
      </div>

      <h2
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-t1)",
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 15,
          color: "var(--k-t2)",
          lineHeight: 1.55,
          margin: 0,
          flexGrow: 1,
        }}
      >
        {body}
      </p>

      <span
        className="lp-btn-lime lp-btn-lg"
        style={{
          alignSelf: "flex-start",
          marginTop: 8,
          pointerEvents: "none",
        }}
      >
        {ctaLabel}
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
      </span>
    </MotionLink>
  );
}

export default function RouterSplit() {
  const reduce = useReducedMotion();
  const containerVariants = reduce ? undefined : container;
  const itemVariants = reduce ? undefined : item;

  return (
    <>
      <header
        className="lp-nav"
        style={{ borderBottom: "1px solid var(--k-line)" }}
      >
        <Link href="/" className="lp-nav-logo" aria-label="Kronos · Inicio">
          <KronosLogo variant="lockup-h" size={38} />
        </Link>
        <div className="lp-nav-cta">
          <Link
            href="/login"
            className="lp-btn-ghost"
            onClick={() =>
              track("cta_clicked", { location: "router_nav_login" })
            }
          >
            Entrar
          </Link>
        </div>
      </header>

      <main
        id="main"
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
        }}
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          style={{
            width: "100%",
            maxWidth: 1080,
            display: "flex",
            flexDirection: "column",
            gap: 56,
            alignItems: "center",
          }}
        >
          <motion.div
            variants={itemVariants}
            style={{ textAlign: "center", maxWidth: 640 }}
          >
            <p
              className="lp-eyebrow"
              style={{
                justifyContent: "center",
                display: "inline-flex",
                color: "var(--k-t3)",
              }}
            >
              <span className="lp-dot" />
              KRONOS
            </p>
            <h1
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: "clamp(36px, 6vw, 64px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "var(--k-t1)",
                margin: "20px 0 16px",
              }}
            >
              ¿Quién eres?
            </h1>
            <p
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 17,
                color: "var(--k-t2)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Elige tu camino para empezar.
            </p>
          </motion.div>

          <div
            className="router-grid"
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <RouteCard
              eyebrow="ATLETA"
              title="Soy atleta."
              body="Tu racha, tus PRs, skills con coach IA y el WOD del día. Si entrenas solo o en un box que ya usa Kronos."
              ctaLabel="ENTRAR"
              ctaHref="/atletas"
              trackLocation="router_atleta_clicked"
            />
            <RouteCard
              eyebrow="BOX"
              title="Tengo un box."
              body="Programación, reservas, pagos, asistencia y comunicación. Un sistema operativo white-label para tu box."
              ctaLabel="CONOCER"
              ctaHref="/box"
              trackLocation="router_box_clicked"
            />
          </div>
        </motion.div>
      </main>

      <footer
        style={{
          padding: "32px 24px 40px",
          borderTop: "1px solid var(--k-line)",
          textAlign: "center",
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          letterSpacing: "0.22em",
          color: "var(--k-t3)",
        }}
      >
        © 2026 KRONOS ·{" "}
        <Link
          href="/legal/terminos"
          style={{ color: "var(--k-t3)", textDecoration: "none" }}
        >
          TÉRMINOS
        </Link>{" "}
        ·{" "}
        <Link
          href="/legal/privacidad"
          style={{ color: "var(--k-t3)", textDecoration: "none" }}
        >
          PRIVACIDAD
        </Link>
      </footer>
    </>
  );
}
