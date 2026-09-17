"use client";

import Image from "next/image";
import { track } from "../../_lib/track";
import PhoneFrame from "./PhoneFrame";
import { HERO, CTA_LABEL } from "../_data/copy";
import { ArrowRight } from "lucide-react";

/**
 * Entrada (audit 2026-09-15): reposo visible en el servidor; la entrada es CSS
 * pura (.lp-rise). El teléfono va DESPUÉS del titular en el markup para que a
 * 360 el atleta lea la promesa antes de ver la captura (el orden visual en
 * desktop lo restablece la grid en landing.css).
 */
export default function AtletaHero({ boxHref }: { boxHref: string | null }) {
  const ctaHref = boxHref ?? "/atleta-signup";

  return (
    <section className="lp-hero" id="producto">
      <Image
        src="/images/landing/atletas-hero-snatch-kronos.webp"
        alt="Atleta de CrossFit ejecutando un snatch con barra olímpica en un Box"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1320px"
        style={{
          objectFit: "cover",
          objectPosition: "right center",
          opacity: 0.5,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.75) 45%, rgba(8,8,10,0.25) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <div>
          <div className="lp-eyebrow lp-rise">
            <span className="lp-dot" />
            {HERO.eyebrow}
          </div>
          <h1 className="lp-rise lp-rise-1">
            {HERO.claimLineA}
            <br />
            <span className="lp-tag-lime">{HERO.claimLineB}</span>
          </h1>
          <p className="lp-lead lp-rise lp-rise-2">{HERO.sub}</p>
          <div className="lp-hero-actions lp-rise lp-rise-3">
            <a
              href={ctaHref}
              className="lp-btn-lime lp-btn-lg"
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_hero_primary",
                  audience: "atleta",
                })
              }
            >
              {boxHref ? "Ir a mi box" : CTA_LABEL}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
          {!boxHref && (
            <p
              className="lp-rise lp-rise-4"
              style={{
                marginTop: 16,
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                color: "var(--k-t3)",
              }}
            >
              {HERO.ctaTertiary}
            </p>
          )}
        </div>

        <div
          className="lp-phone-wrap lp-rise lp-rise-2"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <PhoneFrame
            src="/manual/atleta/home.png"
            alt="Pantalla de inicio de Kronos Atletas mostrando la racha, próxima clase y leaderboard del WOD del día"
            size="lg"
            glow
            width={320}
          />
        </div>
      </div>
    </section>
  );
}
