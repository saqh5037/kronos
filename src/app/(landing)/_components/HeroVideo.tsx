"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function HeroVideo() {
  const reduceMotion = useReducedMotion();
  const float = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div className="lp-phone-wrap">
      <div className="lp-phone-glow" aria-hidden="true" />
      <motion.div
        className="lp-phone"
        initial={reduceMotion ? false : { y: 18 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        {...(float as object)}
      >
        <video
          src="/landing/kronos-tour.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Tour interactivo de Kronos mostrando dashboard, reservas, skills y salud"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            background: "#000",
          }}
        />
      </motion.div>

      <div
        className="lp-phone-anno"
        style={{
          right: -12,
          top: 80,
          transform: "translateX(100%)",
          color: "var(--k-accent)",
        }}
      >
        <span className="rule" />
        <span>WHITE-LABEL · TU MARCA</span>
      </div>
      <div
        className="lp-phone-anno"
        style={{
          left: -12,
          top: 280,
          transform: "translateX(-100%)",
          color: "var(--k-t3)",
        }}
      >
        <span>TOUR · 47 SEGUNDOS</span>
        <span className="rule" />
      </div>
    </div>
  );
}
