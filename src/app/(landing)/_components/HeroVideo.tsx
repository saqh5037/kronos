"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

export default function HeroVideo() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const float = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    setMuted(next);
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
          ref={videoRef}
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
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          aria-pressed={!muted}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: muted ? "var(--k-accent)" : "rgba(8, 8, 10, 0.7)",
            color: muted ? "var(--k-accent-on)" : "var(--k-t1)",
            border: muted ? "none" : "1px solid var(--k-line-2)",
            borderRadius: 999,
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: muted
              ? "0 8px 24px rgba(200, 255, 45, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          {muted ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15 9a4 4 0 010 6" />
                <path d="M18 6a8 8 0 010 12" />
              </svg>
              ACTIVAR SONIDO
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </svg>
              SILENCIAR
            </>
          )}
        </button>
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
