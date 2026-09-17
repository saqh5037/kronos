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
          alt="Atletas de un Box celebrando juntos al terminar el WOD"
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
          Tu logo, tu color y tu nombre se cargan al dar de alta el Box y salen
          en la pantalla de TV, en las invitaciones que reciben atletas y
          coaches, y en el panel. En todos los planes la app corre sobre{" "}
          <code>kronos-fit.com</code>.
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
        {/* Los cuatro pilares son de todos los planes: lo que distinguía a
            Titanio era el dominio propio y el correo desde el dominio del Box,
            y ninguno de los dos existe todavía (ver ROADMAP en _data/mock.ts). */}
        {[
          {
            title: "Tu marca, no la nuestra",
            body: "Subes el logo del Box y eliges su color al dar de alta, sin cobrand visual ni el logo de un proveedor extranjero encima del tuyo.",
          },
          {
            title: "Donde tu atleta sí la ve",
            body: "Tu logo y tu color salen en la pantalla de TV del Box, en la invitación con la que entra cada atleta y en la que firman tus coaches.",
          },
          {
            title: "Tus comunicaciones, tu nombre",
            body: "Los correos del Box llegan desde no-reply@kronos-fit.com firmados con el nombre de tu Box, y las notificaciones push salen a nombre del Box.",
          },
          {
            title: "Se instala desde el navegador",
            body: "La app del atleta es una app web instalable: tus atletas la agregan a la pantalla de inicio desde el navegador, sin pasar por ninguna tienda de apps.",
          },
        ].map((p) => (
          <m.div key={p.title} className="lp-wl-pillar" variants={v}>
            <span
              className="lp-eyebrow"
              style={{
                color: "var(--k-t3)",
                fontSize: 11,
                marginBottom: 12,
              }}
            >
              TODOS LOS PLANES
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
          Eliges el color de tu marca en el alta, con el selector o pegando el{" "}
          <code>#hex</code>. Cualquier hex válido en sRGB funciona, y lo puedes
          cambiar cuando quieras desde la configuración del Box.
        </div>
      </m.div>
    </section>
  );
}
