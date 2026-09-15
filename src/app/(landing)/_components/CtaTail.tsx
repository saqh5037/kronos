"use client";

import { m, useReducedMotion } from "framer-motion";
import DuotoneImage from "./DuotoneImage";
import {
  CTA_TRIAL_HREF,
  CTA_TRIAL_LABEL,
  CTA_WHATSAPP_HREF,
  CTA_WHATSAPP_LABEL,
  TRIAL_DAYS,
} from "../_data/cta";
import { track } from "../_lib/track";

export default function CtaTail() {
  const reduce = useReducedMotion();

  return (
    <section className="lp-cta-tail-shell">
      <m.div
        className="lp-cta-tail lp-grain"
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <DuotoneImage
          src="/images/landing/box-closing-hero-class.webp"
          alt=""
          intensity="strong"
          position="center 45%"
          sizes="(max-width: 1100px) 100vw, 1200px"
          style={{ borderRadius: "inherit" }}
        />
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            {TRIAL_DAYS} DÍAS · SIN TARJETA · SIN CLÁUSULAS
          </div>
          <h2>
            Prueba Kronos <br />
            en <span className="lp-tag-lime">tu Box</span>.
          </h2>
          <p>
            {TRIAL_DAYS} días sin cargo para que tu staff y tus atletas lo usen.
            Te das de alta tú mismo en minutos; si quieres que te acompañemos con
            la migración, escríbenos y lo hacemos contigo. Si no funciona para tu
            Box, te exportamos todos los datos (atletas, asistencias, PRs, pagos,
            programación) en CSV y cancelas sin cláusulas.
          </p>
        </div>
        <div
          className="lp-cta-stack"
          style={{ position: "relative", zIndex: 1 }}
        >
          <a
            href={CTA_TRIAL_HREF}
            className="lp-btn-lime lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() => track("cta_clicked", { location: "cta_tail" })}
          >
            {CTA_TRIAL_LABEL}
          </a>
          <a
            href={CTA_WHATSAPP_HREF}
            className="lp-btn-ghost lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() =>
              track("cta_clicked", { location: "cta_tail_whatsapp" })
            }
          >
            {CTA_WHATSAPP_LABEL}
          </a>
          <span
            className="lp-caption"
            style={{ color: "var(--k-t3)", textAlign: "center", marginTop: 8 }}
          >
            TU DATA ES TUYA POR CONTRATO
          </span>
        </div>
      </m.div>
    </section>
  );
}
