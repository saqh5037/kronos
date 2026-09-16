"use client";

import HeroVideo from "./HeroVideo";
import DuotoneImage from "./DuotoneImage";
import { HERO_META } from "../_data/mock";
import {
  CTA_TRIAL_HREF,
  CTA_TRIAL_LABEL,
  CTA_WHATSAPP_HREF,
  CTA_WHATSAPP_LABEL,
} from "../_data/cta";
import { track } from "../_lib/track";
import {
  DEFAULT_DISCIPLINE_BRANDING,
  type DisciplineBranding,
} from "@/lib/branding";
import { ArrowRight } from "lucide-react";

/**
 * Hero del landing de Boxes.
 *
 * Entrada (audit 2026-09-15, P0 #1): el stagger de framer con
 * `initial="hidden"` (opacity 0) dejaba el hero invisible ante cualquier fallo
 * de JS. Ahora el markup es visible en el servidor y la entrada es CSS pura
 * (`.lp-rise`, solo bajo `prefers-reduced-motion: no-preference`).
 */
export default function Hero({
  boxHref,
  dominusActive = false,
  branding = DEFAULT_DISCIPLINE_BRANDING,
}: {
  boxHref: string | null;
  dominusActive?: boolean;
  branding?: DisciplineBranding;
}) {
  const ownerHref = dominusActive ? "/founding-dominus" : CTA_TRIAL_HREF;
  const ownerLabel = dominusActive
    ? "Tengo un box · Founding Dominus"
    : CTA_TRIAL_LABEL;

  return (
    <section className="lp-hero" id="producto">
      <DuotoneImage
        src="/images/landing/box-hero-coach-tablet.webp"
        alt={`Coach revisando programación de Kronos en una tablet, dentro de un Box de ${branding.name}`}
        intensity="soft"
        position="center 35%"
        priority
        sizes="100vw"
      />
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-grid">
        <div>
          <div className="lp-eyebrow lp-rise">
            <span className="lp-dot" />
            {branding.heroEyebrow}
          </div>
          <h1 className="lp-rise lp-rise-1">
            {branding.heroTitleLine1}
            <br />
            {branding.heroTitleLine2}
          </h1>
          <p className="lp-lead lp-rise lp-rise-2">{branding.heroSubtitle}</p>
          <div className="lp-hero-actions lp-rise lp-rise-3">
            {boxHref ? (
              <a
                href={boxHref}
                className="lp-btn-lime lp-btn-lg"
                onClick={() =>
                  track("cta_clicked", { location: "hero_to_box" })
                }
              >
                Ir a mi box
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </a>
            ) : (
              <>
                <a
                  href={ownerHref}
                  className="lp-btn-lime lp-btn-lg"
                  onClick={() =>
                    track("cta_clicked", {
                      location: "box_hero_primary",
                      audience: "owner",
                    })
                  }
                >
                  {ownerLabel}
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </a>
                <a
                  href={CTA_WHATSAPP_HREF}
                  className="lp-btn-ghost lp-btn-lg"
                  onClick={() =>
                    track("cta_clicked", {
                      location: "box_hero_whatsapp",
                      audience: "owner",
                    })
                  }
                >
                  {CTA_WHATSAPP_LABEL}
                </a>
              </>
            )}
            {boxHref ? (
              <a
                href="#section-owner"
                className="lp-btn-ghost lp-btn-lg"
                onClick={() =>
                  track("cta_clicked", { location: "hero_secondary" })
                }
              >
                Ver cómo funciona
              </a>
            ) : null}
          </div>
          <div className="lp-hero-meta lp-rise lp-rise-4">
            {HERO_META.strip}
          </div>
        </div>

        <HeroVideo />
      </div>
    </section>
  );
}
