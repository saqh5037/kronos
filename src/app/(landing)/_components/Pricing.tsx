"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  PRICING,
  CURRENCY_SYMBOLS,
  FX_RATES,
  type CurrencyCode,
} from "../_data/mock";
import CurrencySwitcher, { convertPriceFromMXN } from "./CurrencySwitcher";
import { track } from "../_lib/track";

const fadeUp = {
  hidden: { y: 16 },
  show: { y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function unitFor(currency: CurrencyCode): string {
  if (currency === "MXN") return "MXN + IVA · al mes";
  return `${currency} · al mes (referencial)`;
}

export default function Pricing() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;
  const [currency, setCurrency] = useState<CurrencyCode>("MXN");
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
      id="pricing"
      style={{ borderTop: "1px solid var(--k-line)" }}
    >
      <div className="lp-pricing-head">
        <div className="lp-eyebrow">
          <span className="lp-dot" />
          /04 · PRECIOS
        </div>
        <motion.h2
          initial={reduce ? false : { y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: 24 }}
        >
          Tarifa simple. <br />
          Sin <span className="lp-tag-lime">contratos anuales</span>.
        </motion.h2>
        <motion.p
          initial={reduce ? false : { y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginTop: 24, textAlign: "center" }}
        >
          Tres planes. Mes a mes. Sin setup fee. Sin sorpresas. Si querés más,
          subís al siguiente. Si necesitás menos, bajás. La factura nunca te va
          a pasar de lo que dice el plan.
        </motion.p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <CurrencySwitcher
            value={currency}
            onChange={(next) => {
              setCurrency(next);
              track("landing_currency_switched", { currency: next });
            }}
          />
        </div>
      </div>

      <motion.div
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
        {PRICING.map((tier) => {
          const converted = convertPriceFromMXN(tier.price, currency);
          return (
            <motion.div
              key={tier.name}
              className={`lp-price-card${tier.featured ? " featured" : ""}`}
              variants={v}
            >
              <div
                className="nm"
                style={tier.featured ? { color: "var(--k-accent)" } : undefined}
              >
                {tier.name.toUpperCase()}
                {tier.featured ? " ★" : ""}
              </div>
              <div className="qty">
                <span className="v">
                  {converted.symbol}
                  {converted.value}
                </span>
                <span className="u">{unitFor(currency)}</span>
              </div>
              <div className="desc">{tier.desc}</div>
              <ul>
                {tier.features.map((f) => {
                  if (typeof f === "string") {
                    return <li key={f}>{f}</li>;
                  }
                  return (
                    <li key={f.text}>
                      {f.text}
                      <span
                        className="lp-mono"
                        style={{
                          display: "inline-block",
                          marginLeft: 6,
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          color: "var(--k-accent-on, #08080A)",
                          background: "var(--k-accent)",
                          verticalAlign: "middle",
                        }}
                      >
                        Q3 2026
                      </span>
                    </li>
                  );
                })}
              </ul>
              <a
                href={tier.ctaHref}
                className={tier.featured ? "lp-btn-lime" : "lp-btn-ghost"}
                style={{ marginTop: "auto", justifyContent: "center" }}
                onClick={() =>
                  track("landing_pricing_tier_clicked", {
                    tier: tier.name.toLowerCase(),
                    currency,
                  })
                }
              >
                {tier.cta}
              </a>
            </motion.div>
          );
        })}
      </motion.div>

      {currency !== "MXN" ? (
        <p
          className="lp-mono"
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--k-t3)",
            marginTop: 24,
            letterSpacing: "0.04em",
          }}
        >
          PRECIO REFERENCIAL · COBRO EN MXN VÍA STRIPE / MERCADO PAGO · 1{" "}
          {CURRENCY_SYMBOLS[currency]}
          {currency} ≈{" "}
          {(1 / FX_RATES.rates[currency]).toFixed(
            currency === "ARS" || currency === "COP" ? 4 : 2,
          )}{" "}
          MXN · ACTUALIZADO {FX_RATES.asOf}
        </p>
      ) : null}
    </section>
  );
}
