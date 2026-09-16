"use client";

import { track } from "../../_lib/track";
import PhoneFrame from "./PhoneFrame";
import { CTA_LABEL } from "../_data/copy";
import { ArrowRight } from "lucide-react";

type Detail = {
  label: string;
  value: string;
};

export type BenefitSectionProps = {
  /** id usado como anchor (sin #) */
  anchor: string;
  eyebrow: string;
  h2: string;
  body: string;
  detail: Detail;
  phoneSrc: string;
  phoneAlt: string;
  /** layout flip: phone a la izquierda (default false → phone derecha) */
  flip?: boolean;
  /** location enviado a track() en el CTA */
  trackLocation: string;
  /** href del CTA primario — si hay sesión activa, override desde page */
  ctaHref: string;
};

export default function BenefitSection({
  anchor,
  eyebrow,
  h2,
  body,
  detail,
  phoneSrc,
  phoneAlt,
  flip = false,
  trackLocation,
  ctaHref,
}: BenefitSectionProps) {
  // Entrada (audit 2026-09-15): estas secciones vivían detrás de
  // `initial="hidden"` + `whileInView`, así que sin scroll o sin JS la página
  // era 7,000 px de nada. Ahora el reposo es visible y la entrada es CSS pura.
  const Phone = (
    <div
      className="lp-rise lp-rise-1"
      style={{ display: "flex", justifyContent: "center" }}
    >
      <PhoneFrame src={phoneSrc} alt={phoneAlt} size="lg" glow width={300} />
    </div>
  );

  const Text = (
    <div className="lp-rise">
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
          marginTop: 20,
          marginBottom: 20,
          textAlign: "left",
        }}
      >
        {h2}
      </h2>
      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 16,
          color: "var(--k-t2)",
          lineHeight: 1.6,
          margin: "0 0 28px",
          maxWidth: 520,
        }}
      >
        {body}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          paddingTop: 16,
          paddingBottom: 28,
          borderTop: "1px solid var(--k-line)",
        }}
      >
        <span
          className="lp-caption"
          style={{
            color: "var(--k-t3)",
            letterSpacing: "0.22em",
            fontSize: 10,
          }}
        >
          {detail.label}
        </span>
        <span
          className="lp-mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--k-accent)",
          }}
        >
          {detail.value}
        </span>
      </div>

      <a
        href={ctaHref}
        className="lp-btn-lime lp-btn-lg"
        onClick={() => track("cta_clicked", { location: trackLocation })}
      >
        {CTA_LABEL}
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </a>
    </div>
  );

  return (
    <section
      className="lp-section"
      id={anchor}
      style={{ paddingTop: 80, paddingBottom: 80 }}
    >
      <div
        className="atletas-benefit-grid"
        style={{
          display: "grid",
          gridTemplateColumns: flip ? "auto 1fr" : "1fr auto",
          gap: 64,
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {flip ? Phone : Text}
        {flip ? Text : Phone}
      </div>
    </section>
  );
}
