"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { WHITE_LABEL_PALETTES } from "../_data/mock";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function SectionWhiteLabel() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section
      className="lp-section lp-wl-section"
      id="section-whitelabel"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Ambient backdrop — rack de medicine balls + textura gym. Muy sutil
          (opacity 0.12) para no competir con la grid de pilares + paletas. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Image
          src="/images/landing/box-community-celebration.webp"
          alt=""
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
            opacity: 0.12,
            filter: "grayscale(100%) contrast(1.05) brightness(0.55)",
          }}
        />
      </div>
      <m.div
        className="lp-wl-head"
        style={{ position: "relative", zIndex: 1 }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        <m.div className="lp-eyebrow" variants={v}>
          <span className="lp-dot" />
          /03 · WHITE-LABEL REAL
        </m.div>
        <m.h2 variants={v}>La marca del Box, al frente.</m.h2>
        <m.p variants={v}>
          Tu logo, tu color y tu nombre dominan la experiencia del atleta en
          todos los tiers. Hierro y Acero corren sobre{" "}
          <code>tubox.kronos.app</code> con un footer discreto &ldquo;Powered by
          Kronos&rdquo;. Titanio elimina toda marca Kronos: dominio propio,
          emails propios y apps publicadas con tu nombre en App Store y Play
          Store.
        </m.p>
      </m.div>

      <m.div
        className="lp-wl-pillars"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
        style={{ position: "relative", zIndex: 1 }}
      >
        {[
          {
            tier: "TODOS",
            title: "Tu marca, no la nuestra",
            body: "Logo, nombre, color y tipografía del Box. El atleta ve tu identidad en cada pantalla, sin cobrand visual ni el logo de un proveedor extranjero.",
          },
          {
            tier: "TODOS",
            title: "Tu paleta, contraste calculado",
            body: "Pegas un #hex y el motor calcula el contraste accesible sobre cada superficie. Lima requiere texto negro. Sangre requiere texto blanco. Cero ajustes manuales.",
          },
          {
            tier: "TITANIO",
            title: "Tu dominio, sin Kronos",
            body: "app.tubox.mx (o el dominio que elijas). Sin redirects, sin subdominios compartidos, sin badge en el footer. Configuración DNS asistida en el onboarding.",
          },
          {
            tier: "TITANIO",
            title: "Tus comunicaciones, tu nombre",
            body: "Emails desde no-reply@tubox.mx, no desde Kronos. Push notifications firmadas como el Box. SMS desde tu sender ID si lo configuras. En Hierro y Acero los emails llegan desde no-reply@kronos-fit.com firmados por el Box.",
          },
          {
            tier: "TITANIO",
            title: "Tu marca en App Store y Play Store",
            body: "App nativa con tu nombre y tu ícono publicada en stores. Apple Developer Account a tu nombre, gestión del review process incluida. En Acero las apps son cobranded (tu logo, sub-marca Kronos).",
          },
        ].map((p) => (
          <m.div key={p.title} className="lp-wl-pillar" variants={v}>
            <span
              className="lp-eyebrow"
              style={{
                color: p.tier === "TITANIO" ? "var(--k-accent)" : "var(--k-t3)",
                fontSize: 11,
                marginBottom: 12,
              }}
            >
              {p.tier === "TITANIO" ? "★ TITANIO" : "TODOS LOS TIERS"}
            </span>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </m.div>
        ))}
      </m.div>

      <m.div
        className="lp-palette-row"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.06 } } }
        }
        style={{
          padding: "0 48px",
          maxWidth: 1320,
          margin: "32px auto 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {WHITE_LABEL_PALETTES.map((p) => (
          <m.div key={p.name} className="lp-palette-card" variants={v}>
            <div
              className="swatch"
              style={{
                background: p.hex,
                boxShadow: p.glow ? `0 0 20px ${p.hex}55` : undefined,
              }}
            />
            <div>
              <div className="nm">{p.name}</div>
              <div className="hex">{p.hex}</div>
            </div>
            <div className="who">{p.caption}</div>
          </m.div>
        ))}
      </m.div>

      <m.div
        className="lp-wl-note"
        initial={reduce ? false : { y: 12 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <span className="lp-dot" />
        <div className="text">
          Pegas el <code>#hex</code> de tu marca en el setup. El motor calcula
          contraste, estados hover, bordes y focus rings automáticamente.
          Cualquier hex válido en sRGB funciona. Si no pasa los thresholds WCAG
          AA, el sistema sugiere el más cercano que sí los pasa.
        </div>
      </m.div>
    </section>
  );
}
