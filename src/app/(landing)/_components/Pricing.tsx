"use client";

import { useRef, useEffect } from "react";
import { m, useReducedMotion } from "framer-motion";
import { PRICING } from "../_data/mock";
import { track } from "../_lib/track";

const fadeUp = {
  hidden: { y: 16 },
  show: { y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Pricing() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackedView = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !trackedView.current) {
            trackedView.current = true;
            track("landing_pricing_viewed");
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="lp-section"
      id="section-pricing"
      style={{ borderTop: "1px solid var(--k-line)" }}
    >
      <div className="lp-pricing-head">
        <div className="lp-eyebrow">
          <span className="lp-dot" />
          /04 · PRECIOS EN PESOS
        </div>
        <m.h2
          initial={reduce ? false : { y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: 24 }}
        >
          Tres planes. En pesos. Sin sorpresas.
        </m.h2>
        <m.p
          initial={reduce ? false : { y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginTop: 24, textAlign: "center" }}
        >
          Fee fijo mensual en MXN. Sin contratos anuales. Sin setup fee. Sin
          cargo extra por aceptar tarjeta. Tu Box crece o decrece, te avisamos
          antes de cambiar de tier — nunca te cobramos algo que no autorizaste.
        </m.p>
      </div>

      <m.div
        className="lp-pricing"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        {PRICING.map((tier) => (
          <m.div
            key={tier.name}
            className={`lp-price-card${tier.featured ? " featured" : ""}`}
            variants={v}
            onMouseEnter={() =>
              track("pricing_card_hovered", {
                tier: tier.name.toLowerCase(),
              })
            }
          >
            {tier.featured && (
              <div className="lp-price-badge">
                <span className="lp-eyebrow">★ RECOMENDADO</span>
              </div>
            )}
            <div
              className="nm"
              style={tier.featured ? { color: "var(--k-accent)" } : undefined}
            >
              {tier.name.toUpperCase()}
            </div>
            <div className="qty">
              <span className="v">{tier.price}</span>
              <span className="u">{tier.unit}</span>
            </div>
            <div className="desc">{tier.desc}</div>
            <ul>
              {tier.features.map((f) => (
                <li key={f}>+ {f}</li>
              ))}
            </ul>
            <a
              href={tier.ctaHref}
              className={tier.featured ? "lp-btn-lime" : "lp-btn-ghost"}
              style={{ marginTop: "auto", justifyContent: "center" }}
              onClick={() =>
                track("cta_clicked", {
                  location: `pricing_${tier.name.toLowerCase()}`,
                })
              }
            >
              {tier.cta}
            </a>
          </m.div>
        ))}
      </m.div>

      <p
        className="lp-mono"
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--k-t3)",
          marginTop: 32,
          lineHeight: 1.6,
          maxWidth: 700,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Precios en MXN, sin IVA. Sin contratos anuales. Sin setup fee. Sin cargo
        por integración con Stripe o Mercado Pago. Si tu Box crece y supera el
        cap de atletas, te avisamos antes de pasar al tier siguiente. Si
        decrece, también — pagas lo que corresponde al volumen real del mes.
        <br />
        <br />
        Para 5+ sedes o casos enterprise, escríbenos.
      </p>
    </section>
  );
}
