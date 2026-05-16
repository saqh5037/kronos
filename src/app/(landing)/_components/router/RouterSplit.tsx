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

const MotionLink = motion(Link);

type AthleteCardProps = { audience: "athlete" };
type BoxCardProps = { audience: "box" };

function AthleteCard({}: AthleteCardProps) {
  return (
    <MotionLink
      variants={cardItem}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      href="/atleta-signup"
      onClick={() =>
        track("cta_clicked", {
          location: "home_router_athlete_card",
          audience: "athlete",
        })
      }
      aria-label="Soy atleta — Empezar gratis para siempre"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "44px 36px",
        minHeight: 360,
        textDecoration: "none",
        color: "var(--k-accent-on)",
        background: "var(--k-accent)",
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 24px 80px rgba(200, 255, 45, 0.18), 0 0 0 1px rgba(200, 255, 45, 0.4)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          padding: "6px 14px",
          background: "var(--k-accent-on)",
          color: "var(--k-accent)",
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          borderRadius: 999,
          border: "1px solid var(--k-accent-on)",
        }}
      >
        GRATIS PARA SIEMPRE
      </div>

      <div
        className="lp-eyebrow"
        style={{
          color: "var(--k-accent-on)",
          letterSpacing: "0.22em",
          opacity: 0.7,
        }}
      >
        <span className="lp-dot" style={{ background: "var(--k-accent-on)" }} />
        SOY ATLETA
      </div>

      <h2
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: "clamp(34px, 4vw, 48px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-accent-on)",
          margin: 0,
          lineHeight: 1.02,
          maxWidth: "90%",
        }}
      >
        Tu progreso.
        <br />
        Tu racha. Tus PRs.
      </h2>

      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 16,
          color: "var(--k-accent-on)",
          opacity: 0.85,
          lineHeight: 1.55,
          margin: 0,
          flexGrow: 1,
          maxWidth: "92%",
        }}
      >
        Registra tus PRs, sigue tu racha y compite en el leaderboard.
        <strong style={{ opacity: 1 }}>
          {" "}
          Aunque tu Box todavía no use Kronos.
        </strong>
      </p>

      <span
        style={{
          alignSelf: "flex-start",
          marginTop: 12,
          padding: "14px 24px",
          background: "var(--k-accent-on)",
          color: "var(--k-accent)",
          fontFamily: "var(--k-font-display)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.04em",
          borderRadius: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        Empezar gratis
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </MotionLink>
  );
}

function BoxCard({}: BoxCardProps) {
  return (
    <MotionLink
      variants={cardItem}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      href="/box"
      onClick={() =>
        track("cta_clicked", {
          location: "home_router_box_card",
          audience: "box",
        })
      }
      aria-label="Soy dueño de Box — Ver Kronos para tu Box"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "36px 32px",
        minHeight: 360,
        textDecoration: "none",
        color: "var(--k-t1)",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line-2)",
        borderRadius: 20,
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          padding: "5px 12px",
          background: "transparent",
          color: "var(--k-t3)",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.18em",
          borderRadius: 999,
          border: "1px solid var(--k-line-2)",
        }}
      >
        PARA DUEÑOS DE BOX
      </div>

      <div
        className="lp-eyebrow"
        style={{
          color: "var(--k-accent)",
          letterSpacing: "0.22em",
        }}
      >
        <span className="lp-dot" />
        TENGO UN BOX
      </div>

      <h2
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: "clamp(28px, 3.2vw, 38px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-t1)",
          margin: 0,
          lineHeight: 1.05,
          maxWidth: "92%",
        }}
      >
        El sistema operativo de tu CrossFit Box.
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
        White-label real, multi-tenant, pagos LATAM nativos. Tus atletas usan la
        app gratis incluida — sin costo extra por usuario.
      </p>

      <span
        className="lp-btn-ghost lp-btn-lg"
        style={{
          alignSelf: "flex-start",
          marginTop: 8,
          pointerEvents: "none",
        }}
      >
        Ver Kronos para tu Box
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
          padding: "56px 24px",
        }}
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          style={{
            width: "100%",
            maxWidth: 1180,
            display: "flex",
            flexDirection: "column",
            gap: 48,
            alignItems: "center",
          }}
        >
          <motion.div
            variants={itemVariants}
            style={{ textAlign: "center", maxWidth: 720 }}
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
                fontSize: "clamp(36px, 6.5vw, 68px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.02,
                color: "var(--k-t1)",
                margin: "20px 0 16px",
              }}
            >
              Tu CrossFit en una app.
            </h1>
            <p
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: "clamp(16px, 1.6vw, 19px)",
                color: "var(--k-t2)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <span style={{ color: "var(--k-accent)", fontWeight: 600 }}>
                Gratis para atletas.
              </span>{" "}
              Premium para tu Box.
            </p>
          </motion.div>

          <div
            className="router-dual-grid"
            style={{
              width: "100%",
              display: "grid",
              gap: 20,
            }}
          >
            <AthleteCard audience="athlete" />
            <BoxCard audience="box" />
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
