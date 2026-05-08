"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WHITE_LABEL_PALETTES } from "../_data/mock";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function SectionWhiteLabel() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section lp-wl-section" id="section-whitelabel">
      <motion.div
        className="lp-wl-head"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        <motion.div className="lp-eyebrow" variants={v}>
          <span className="lp-dot" />
          /03 · WHITE-LABEL REAL
        </motion.div>
        <motion.h2 variants={v}>La app del Box es del Box.</motion.h2>
        <motion.p variants={v}>
          No es un skin. No es co-branded. No es &ldquo;powered by
          Kronos&rdquo;. Es la marca del Box arriba, nuestro motor abajo, en tu
          dominio, con tu logo, en App Store y Play Store si lo decidís. El
          atleta nunca lee Kronos en pantalla.
        </motion.p>
      </motion.div>

      <motion.div
        className="lp-wl-pillars"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        {[
          {
            title: "Tu dominio",
            body: "app.tubox.mx (o el dominio que elijas). Sin redirects. Sin subdominios compartidos. Configuración DNS asistida en el onboarding.",
          },
          {
            title: "Tu paleta",
            body: "Pegás un #hex y el motor calcula el contraste accesible sobre cada superficie. Lima requiere texto negro. Sangre requiere texto blanco. Cero ajustes manuales.",
          },
          {
            title: "Tus comunicaciones",
            body: "Emails desde no-reply@tubox.mx, no desde Kronos. Push notifications firmadas como el Box. SMS desde tu sender ID si lo configurás.",
          },
          {
            title: "Tu marca en stores (Acero+)",
            body: "App nativa con tu nombre y tu ícono publicada en App Store y Play Store. Apple Developer Account a tu nombre, gestión del review process incluida.",
          },
        ].map((p) => (
          <motion.div key={p.title} className="lp-wl-pillar" variants={v}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="lp-palette-row"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.06 } } }
        }
        style={{ padding: "0 48px", maxWidth: 1320, margin: "32px auto 0" }}
      >
        {WHITE_LABEL_PALETTES.map((p) => (
          <motion.div key={p.name} className="lp-palette-card" variants={v}>
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
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="lp-wl-note"
        initial={reduce ? false : { y: 12 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <span className="lp-dot" />
        <div className="text">
          Pegás el <code>#hex</code> de tu marca en el setup. El motor calcula
          contraste, estados hover, bordes y focus rings automáticamente.
          Cualquier hex válido en sRGB funciona. Si no pasa los thresholds WCAG
          AA, el sistema sugiere el más cercano que sí los pasa.
        </div>
      </motion.div>
    </section>
  );
}
