"use client";

import { motion, useReducedMotion } from "framer-motion";
import DuotoneImage from "./DuotoneImage";
import { track } from "../_lib/track";

export default function CtaTail() {
  const reduce = useReducedMotion();

  return (
    <section className="lp-cta-tail-shell">
      <motion.div
        className="lp-cta-tail lp-grain"
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <DuotoneImage
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=80"
          alt=""
          intensity="soft"
          position="center 40%"
          sizes="(max-width: 1100px) 100vw, 1200px"
          style={{ borderRadius: "inherit" }}
        />
        <div
          style={{ flex: 1, minWidth: 320, position: "relative", zIndex: 1 }}
        >
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            30 DÍAS · SIN TARJETA · SIN CLÁUSULAS
          </div>
          <h2>
            Probá Kronos <br />
            en <span className="lp-tag-lime">tu Box</span>.
          </h2>
          <p>
            30 días sin cargo para que tu staff y tus atletas lo usen. Si no
            funciona para tu Box, te exportamos todos los datos (atletas,
            asistencias, PRs, pagos, programación) en CSV y cancelamos sin
            cláusulas.
          </p>
        </div>
        <div
          className="lp-cta-stack"
          style={{ position: "relative", zIndex: 1 }}
        >
          <a
            href="mailto:demo@kronos.app?subject=Demo%20Kronos"
            className="lp-btn-lime lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() => track("landing_demo_booked", { source: "cta_tail" })}
          >
            Reservar demo →
          </a>
          <a
            href="mailto:ventas@kronos.app"
            className="lp-btn-ghost lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() =>
              track("landing_demo_booked", { source: "cta_tail_sales" })
            }
          >
            Hablar con ventas
          </a>
          <span
            className="lp-caption"
            style={{ color: "var(--k-t3)", textAlign: "center", marginTop: 8 }}
          >
            TU DATA ES TUYA POR CONTRATO
          </span>
        </div>
      </motion.div>
    </section>
  );
}
